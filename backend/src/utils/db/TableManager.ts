import { FileMigrationProvider, type Kysely, Migrator, sql } from "kysely";
import path, { dirname, join } from "node:path";
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import { promises as fs } from "fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* TODO: We should put as a large header comment a summary of what SQL commands we ran here */

export class TableManager {
	// migrations = [{ up: fixUserNamingUp, down: fixUserNamingDown }];

	// biome-ignore lint/suspicious/noExplicitAny: Kysely needs to be passed the "any" type here
	async createDBTables(db: Kysely<any>): Promise<void> {
		/**
		 * create table users (
		 *      username varchar(20) primary key,
		 *      password_hash varchar(255),
		 *      full_name varchar(40),
		 *      profile_picture varchar(255),
		 *      user_created_at timestamp not null default now()
		 * );
		 */
		const createUsersTable = db.schema
			.createTable("users")
			.addColumn("username", "varchar(20)", (col) => col.primaryKey())
			.addColumn("password_hash", "varchar(255)")
			.addColumn("full_name", "varchar(40)")
			.addColumn("profile_picture", "varchar(255)")
			.addColumn("user_created_at", "timestamp", (col) =>
				col.defaultTo(sql`now()`).notNull(),
			)
			.execute();

		/**
		 * create table portfolios (
		 *      owner varchar(20) not null references users(username) on delete cascade,
		 *      portfolio_name varchar(30) not null,
		 *      cash decimal(18, 2),
		 *      portfolio_created_at timestamp not null default now(),
		 *      primary key (owner, portfolio_name)
		 * );
		 */
		const createPortfoliosTable = db.schema
			.createTable("portfolios")
			.addColumn("owner", "varchar(20)", (col) =>
				col.notNull().references("users.username").onDelete("cascade"),
			)
			.addColumn("portfolio_name", "varchar(30)", (col) => col.notNull())
			.addColumn("cash", "decimal(18, 2)")
			.addColumn("portfolio_created_at", "timestamp", (col) =>
				col.defaultTo(sql`now()`).notNull(),
			)
			.addPrimaryKeyConstraint("portfolios_pkey", ["owner", "portfolio_name"])
			.execute();

		/**
		 * create table stocks_list (
		 *      owner varchar(20),
		 *      stock_list_name varchar(30),
		 *      private boolean,
		 *      primary key (owner, stock_list_name),
		 *      foreign key (owner) references users(username)
		 * );
		 */
		const createStocksListTable = db.schema
			.createTable("stocks_list")
			.addColumn("owner", "varchar(20)")
			.addColumn("stock_list_name", "varchar(30)")
			.addColumn("private", "boolean")
			.addPrimaryKeyConstraint("stocks_list_primary", [
				"owner",
				"stock_list_name",
			])
			.addForeignKeyConstraint("stocks_list_owner_fk", ["owner"], "users", [
				"username",
			])
			.execute();

		/**
		 * create table stocks (
		 *      stock_symbol varchar(10) primary key,
		 *      company varchar(200),
		 *      description varchar(5000)
		 * );
		 */
		const createStocksTable = db.schema
			.createTable("stocks")
			.addColumn("stock_symbol", "varchar(10)", (col) => col.primaryKey())
			.addColumn("company", "varchar(200)")
			.addColumn("description", "varchar(5000)")
			.execute();

		await Promise.all([
			createUsersTable,
			createPortfoliosTable,
			createStocksListTable,
			createStocksTable,
		]);

		/**
		 * create table stocks_daily (
		 *     stock_symbol varchar(10) not null,
		 *     stock_date date not null,
		 *     open_price decimal(18, 2) not null,
		 *     close_price decimal(18, 2) not null,
		 *     low decimal(18, 2) not null,
		 *     high decimal(18, 2) not null,
		 *     volume bigint not null,
		 *     return decimal(18, 2),
		 *     primary key (stock_symbol, stock_date),
		 *     foreign key (stock_symbol) references stocks(stock_symbol)
		 * );
		 */
		const createStocksDailyTable = db.schema
			.createTable("stocks_daily")
			.addColumn("stock_symbol", "varchar(10)", (col) => col.notNull())
			.addColumn("stock_date", "date", (col) => col.notNull())
			.addColumn("open_price", "decimal(18, 2)", (col) => col.notNull())
			.addColumn("close_price", "decimal(18, 2)", (col) => col.notNull())
			.addColumn("low", "decimal(18, 2)", (col) => col.notNull())
			.addColumn("high", "decimal(18, 2)", (col) => col.notNull())
			.addColumn("volume", "bigint", (col) => col.notNull())
			.addColumn("return", "decimal(18, 2)")
			.addPrimaryKeyConstraint("stocks_daily_pk", [
				"stock_symbol",
				"stock_date",
			])
			.addForeignKeyConstraint(
				"stocks_daily_fk_stock_symbol",
				["stock_symbol"],
				"stocks",
				["stock_symbol"],
			)
			.execute();

		/**
		 * create table market_index_daily (
		 *     stock_date date not null,
		 *     open_price decimal(18, 2) not null,
		 *     close_price decimal(18, 2) not null,
		 *     low decimal(18, 2) not null,
		 *     high decimal(18, 2) not null,
		 *     volume bigint not null,
		 *     return decimal(18, 2),
		 *     primary key (stock_date)
		 * );
		 */
		const createMarketIndexTable = db.schema
			.createTable("market_index_daily")
			.addColumn("stock_date", "date", (col) => col.notNull())
			.addColumn("open_price", "decimal(18, 2)", (col) => col.notNull())
			.addColumn("close_price", "decimal(18, 2)", (col) => col.notNull())
			.addColumn("low", "decimal(18, 2)", (col) => col.notNull())
			.addColumn("high", "decimal(18, 2)", (col) => col.notNull())
			.addColumn("volume", "bigint", (col) => col.notNull())
			.addColumn("return", "decimal(18, 2)")
			.addPrimaryKeyConstraint("market_index_daily_pk", ["stock_date"])
			.execute();

		/**
		 * create table reviews (
		 *     reviewer varchar(20),
		 *     stock_list_owner varchar(20),
		 *     stock_list_name varchar(30),
		 *     content varchar(200),
		 *     rating numeric(2, 1),
		 *     review_creation_time timestamp not null default now(),
		 *     review_last_updated timestamp,
		 *     primary key (reviewer, stock_list_owner, stock_list_name),
		 *     foreign key (reviewer) references users(username),
		 *     foreign key (stock_list_owner, stock_list_name) references stocks_list(owner, stock_list_name)
		 */
		const createReviewsTable = db.schema
			.createTable("reviews")
			.addColumn("reviewer", "varchar(20)")
			.addColumn("stock_list_owner", "varchar(20)")
			.addColumn("stock_list_name", "varchar(30)")
			.addColumn("content", "varchar(200)")
			.addColumn("rating", "numeric(2, 1)")
			.addColumn("review_creation_time", "timestamp", (col) =>
				col.defaultTo(sql`now()`).notNull(),
			)
			.addColumn("review_last_updated", "timestamp")
			.addPrimaryKeyConstraint("review_pk", [
				"reviewer",
				"stock_list_owner",
				"stock_list_name",
			])
			.addForeignKeyConstraint("review_reviewer_fk", ["reviewer"], "users", [
				"username",
			])
			.addForeignKeyConstraint(
				"review_stock_list_fk",
				["stock_list_owner", "stock_list_name"],
				"stocks_list",
				["owner", "stock_list_name"],
			)
			.execute();

		/**
		 * create table friends (
		 *     requesting_friend varchar(20),
		 *     receiving_friend varchar(20),
		 *     pending boolean,
		 *     primary key (requesting_friend, receiving_friend),
		 *     foreign key (requesting_friend) references users(username),
		 *     foreign key (receiving_friend) references users(username)
		 * );
		 */
		const createFriendsTable = db.schema
			.createTable("friends")
			.addColumn("requesting_friend", "varchar(20)")
			.addColumn("receiving_friend", "varchar(20)")
			.addColumn("pending", "boolean")
			.addPrimaryKeyConstraint("friend_primary", [
				"requesting_friend",
				"receiving_friend",
			])
			.addForeignKeyConstraint(
				"friend_user_foreign1",
				["requesting_friend"],
				"users",
				["username"],
			)
			.addForeignKeyConstraint(
				"friend_user_foreign2",
				["receiving_friend"],
				"users",
				["username"],
			)
			.execute();

		/**
		 * create table request_timeout (
		 *     request_user varchar(20),
		 *     receive_user varchar(20),
		 *     expiry_time timestamp,
		 *     primary key (request_user, receive_user),
		 *     foreign key (request_user) references users(username),
		 *     foreign key (receive_user) references users(username)
		 * );
		 */
		const createRequestTimeoutTable = db.schema
			.createTable("request_timeout")
			.addColumn("request_user", "varchar(20)")
			.addColumn("receive_user", "varchar(20)")
			.addColumn("expiry_time", "timestamp")
			.addPrimaryKeyConstraint("request_primary", [
				"request_user",
				"receive_user",
			])
			.addForeignKeyConstraint(
				"request_user_foreign1",
				["request_user"],
				"users",
				["username"],
			)
			.addForeignKeyConstraint(
				"request_user_foreign2",
				["receive_user"],
				"users",
				["username"],
			)
			.execute();

		/**
		 * create table investments (
		 *     owner varchar(20),
		 *     portfolio_name varchar(30),
		 *     stock_symbol varchar(10),
		 *     num_shares integer,
		 *     primary key (owner, portfolio_name, stock_symbol),
		 *     foreign key (owner, portfolio_name) references portfolios(owner, portfolio_name),
		 *     foreign key (stock_symbol) references stocks(stock_symbol)
		 * );
		 */
		const createInvestmentsTable = db.schema
			.createTable("investments")
			.addColumn("owner", "varchar(20)")
			.addColumn("portfolio_name", "varchar(30)")
			.addColumn("stock_symbol", "varchar(10)")
			.addColumn("num_shares", "integer")
			.addPrimaryKeyConstraint("investment_primary", [
				"owner",
				"portfolio_name",
				"stock_symbol",
			])
			.addForeignKeyConstraint(
				"investment_foreign1",
				["owner", "portfolio_name"],
				"portfolios",
				["owner", "portfolio_name"],
			)
			.addForeignKeyConstraint(
				"investment_foreign2",
				["stock_symbol"],
				"stocks",
				["stock_symbol"],
			)
			.execute();

		/**
		 * create table private_access (
		 *     user varchar(20),
		 *     stock_list_owner varchar(20),
		 *     stock_list_name varchar(30),
		 *     primary key (user, stock_list_owner, stock_list_name),
		 *     foreign key (user) references users(username),
		 *     foreign key (stock_list_owner, stock_list_name) references stocks_list(owner, stock_list_name)
		 * );
		 */
		const createPrivateAccessTable = db.schema
			.createTable("private_access")
			.addColumn("user", "varchar(20)")
			.addColumn("stock_list_owner", "varchar(20)")
			.addColumn("stock_list_name", "varchar(30)")
			.addPrimaryKeyConstraint("private_access_primary", [
				"user",
				"stock_list_owner",
				"stock_list_name",
			])
			.addForeignKeyConstraint("private_access_user_fk", ["user"], "users", [
				"username",
			])
			.addForeignKeyConstraint(
				"private_access_stock_list_fk",
				["stock_list_owner", "stock_list_name"],
				"stocks_list",
				["owner", "stock_list_name"],
			)
			.execute();

		/**
		 * create table contains (
		 *     stock_list_owner varchar(20),
		 *     stock_list_name varchar(30),
		 *     stock_symbol varchar(10),
		 *     num_shares integer default 0,
		 *     primary key (stock_list_owner, stock_list_name, stock_symbol),
		 *     foreign key (stock_list_owner, stock_list_name) references stocks_list(owner, stock_list_name),
		 *     foreign key (stock_symbol) references stocks(stock_symbol)
		 * );
		 */
		const createContainsTable = db.schema
			.createTable("contains")
			.addColumn("stock_list_owner", "varchar(20)")
			.addColumn("stock_list_name", "varchar(30)")
			.addColumn("stock_symbol", "varchar(10)")
			.addColumn("num_shares", "integer", (col) => col.defaultTo(0))
			.addPrimaryKeyConstraint("contains_primary", [
				"stock_list_owner",
				"stock_list_name",
				"stock_symbol",
			])
			.addForeignKeyConstraint(
				"contains_foreign1",
				["stock_list_owner", "stock_list_name"],
				"stocks_list",
				["owner", "stock_list_name"],
			)
			.addForeignKeyConstraint(
				"contains_foreign2",
				["stock_symbol"],
				"stocks",
				["stock_symbol"],
			)
			.execute();

		await Promise.all([
			createStocksDailyTable,
			createMarketIndexTable,
			createReviewsTable,
			createFriendsTable,
			createPrivateAccessTable,
			createRequestTimeoutTable,
			createInvestmentsTable,
			createContainsTable,
		]);
	}

	// biome-ignore lint/suspicious/noExplicitAny: Kysely needs to be passed the "any" type here
	async runMigrations(db: Kysely<any>) {
		console.log(pathToFileURL(join(__dirname, "migrations")).href);
		const migrator = new Migrator({
			db,
			provider: new FileMigrationProvider({
				fs,
				path: {
					join,
				},
				// This needs to be an absolute path.
				migrationFolder: join(__dirname, "migrations"), // Use absolute path directly
			}),
		});

		const { error, results } = await migrator.migrateToLatest();

		if (error) {
			console.error("failed to migrate");
			console.error(error);
			return;
		}

		if (!results) {
			console.log("no migrations were executed");
			return;
		}

		for (const it of results) {
			if (it.status === "Success") {
				console.log(
					`migration "${it.migrationName}" was executed successfully`,
				);
			} else if (it.status === "Error") {
				console.error(`failed to execute migration "${it.migrationName}"`);
			}
		}

		if (error) {
			console.error("failed to migrate");
			console.error(error);
			process.exit(1);
		}

		await db.destroy();
	}

	// biome-ignore lint/suspicious/noExplicitAny: necessary for kysely
	async createIndexes(db: Kysely<any>) {
    /**
     * create index idx_requesting_friend
     * on friends (requesting_friend);
     */
    await db.schema
        .createIndex("idx_requesting_friend")
        .on("friends")
        .column("requesting_friend")
        .execute();

    /**
     * create index idx_receiving_friend
     * on friends (receiving_friend);
     */
    await db.schema
        .createIndex("idx_receiving_friend")
        .on("friends")
        .column("receiving_friend")
        .execute();

    /**
     * create index idx_portfolio_name
     * on portfolios (portfolio_name);
     */
    await db.schema
        .createIndex("idx_portfolio_name")
        .on("portfolios")
        .column("portfolio_name")
        .execute();

    /**
     * create index idx_stock_list_name
     * on stock_lists (stock_list_name);
     */
    await db.schema
        .createIndex("idx_stock_list_name")
        .on("stock_lists")
        .column("stock_list_name")
        .execute();
}

}
