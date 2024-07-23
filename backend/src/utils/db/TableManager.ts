import { FileMigrationProvider, type Kysely, Migrator, sql } from "kysely";
import path, { dirname, join } from "node:path";
import { promises as fs } from "fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* TODO: We should put as a large header comment a summary of what SQL commands we ran here */

export class TableManager {
	// migrations = [{ up: fixUserNamingUp, down: fixUserNamingDown }];

	// biome-ignore lint/suspicious/noExplicitAny: Kysely needs to be passed the "any" type here
	async createDBTables(db: Kysely<any>): Promise<void> {
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

		const createStocksTable = db.schema
			.createTable("stocks")
			.addColumn("stock_symbol", "varchar(10)", (col) => col.primaryKey())
			.addColumn("company", "varchar(200)")
			.execute();

		await Promise.all([
			createUsersTable,
			createPortfoliosTable,
			createStocksListTable,
			createStocksTable,
		]);

		const createStocksDailyTable = db.schema
			.createTable("stocks_daily")
			.addColumn("stock_symbol", "varchar(10)", (col) => col.notNull())
			.addColumn("stock_date", "date", (col) => col.notNull())
			.addColumn("open_price", "decimal(18, 2)", (col) => col.notNull())
			.addColumn("close_price", "decimal(18, 2)", (col) => col.notNull())
			.addColumn("low", "decimal(18, 2)", (col) => col.notNull())
			.addColumn("high", "decimal(18, 2)", (col) => col.notNull())
			.addColumn("volume", "bigint", (col) => col.notNull())
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

		const createReviewsTable = db.schema
			.createTable("reviews")
			.addColumn("reviewer", "varchar(20)")
			.addColumn("stock_list_owner", "varchar(20)")
			.addColumn("stock_list_name", "varchar(30)")
			.addColumn("content", "varchar(200)")
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

		// Maybe fix the expiry time here or when entering value with the +5 minutes using a trigger in the database
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
		await db.schema
			.createIndex("idx_username")
			.on("users")
			.column("username")
			.execute();

		await db.schema
			.createIndex("idx_requesting_friend")
			.on("friends")
			.column("requesting_friend")
			.execute();

		await db.schema
			.createIndex("idx_receiving_friend")
			.on("friends")
			.column("receiving_friend")
			.execute();
	}
}
