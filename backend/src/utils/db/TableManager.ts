import { FileMigrationProvider, type Kysely, Migrator, sql } from "kysely";
import path, { dirname, join } from "node:path";
import { promises as fs } from "fs";
import { db } from "./database";
import {
	up as fixUserNamingUp,
	down as fixUserNamingDown,
} from "./migrations/20240710_fix_user_naming";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* TODO: We should put as a large header comment a summary of what SQL commands we ran here */

export class TableManager {
	migrations = [{ up: fixUserNamingUp, down: fixUserNamingDown }];

	// biome-ignore lint/suspicious/noExplicitAny: Kysely needs to be passed the "any" type here
	async createDBTables(db: Kysely<any>): Promise<void> {
		const createUsersTable = db.schema
			.createTable("users")
			.addColumn("id", "serial", (col) => col.primaryKey())
			.addColumn("username", "varchar(20)", (col) => col.unique().notNull())
			.addColumn("password_hash", "varchar(20)")
			.addColumn("first_name", "varchar(20)")
			.addColumn("surname", "varchar(20)")
			.addColumn("user_created_at", "timestamp", (col) =>
				col.defaultTo(sql`now()`).notNull(),
			)
			.execute();

		const createPortfoliosTable = db.schema
			.createTable("portfolios")
			.addColumn("id", "serial", (col) => col.primaryKey())
			.addColumn("portfolio_name", "varchar(30)")
			.addColumn("cash", "decimal(18, 2)")
			.addColumn("portfolio_created_at", "timestamp", (col) =>
				col.defaultTo(sql`now()`).notNull(),
			)
			.execute();

		const createStocksListTable = db.schema
			.createTable("stocks_list")
			.addColumn("id", "serial", (col) => col.primaryKey())
			.addColumn("private", "boolean")
			.addColumn("stock_list_name", "varchar(30)")
			.execute();

		const createStocksTable = db.schema
			.createTable("stocks")
			.addColumn("stock_symbol", "varchar(10)", (col) => col.primaryKey())
			.addColumn("comapany", "varchar(20)")
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
			.addColumn("volume", "integer", (col) => col.notNull())
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
			.addColumn("user_id", "integer")
			.addColumn("stock_list_id", "integer")
			.addColumn("content", "varchar(200)")
			.addColumn("review_creation_time", "timestamp", (col) =>
				col.defaultTo(sql`now()`).notNull(),
			)
			.addColumn("review_last_updated", "timestamp")
			.addPrimaryKeyConstraint("review_primary", ["user_id", "stock_list_id"])
			.addForeignKeyConstraint("review_user_foreign1", ["user_id"], "users", [
				"id",
			])
			.addForeignKeyConstraint(
				"review_user_foreign2",
				["stock_list_id"],
				"stocks_list",
				["id"],
			)
			.execute();

		const createFriendsTable = db.schema
			.createTable("friends")
			.addColumn("friend1", "integer")
			.addColumn("friend2", "integer")
			.addColumn("requesting_friend", "integer")
			.addColumn("pending", "boolean")
			.addPrimaryKeyConstraint("friend_primary", ["friend1", "friend2"])
			.addForeignKeyConstraint("friend_user_foreign1", ["friend1"], "users", [
				"id",
			])
			.addForeignKeyConstraint("friend_user_foreign2", ["friend2"], "users", [
				"id",
			])
			.addForeignKeyConstraint(
				"friend_user_foreign3",
				["requesting_friend"],
				"users",
				["id"],
			)
			.execute();

		// Maybe fix the expiry time here or when entering value with the +5 minutes
		const createRequestTimeoutTable = db.schema
			.createTable("request_timeout")
			.addColumn("request_user", "integer")
			.addColumn("receive_user", "integer")
			.addColumn("expiry_time", "timestamp")
			.addPrimaryKeyConstraint("request_primary", [
				"request_user",
				"receive_user",
			])
			.addForeignKeyConstraint(
				"request_user_foreign1",
				["request_user"],
				"users",
				["id"],
			)
			.addForeignKeyConstraint(
				"request_user_foreign2",
				["receive_user"],
				"users",
				["id"],
			)
			.execute();

		const createOwnsTable = db.schema
			.createTable("owns")
			.addColumn("portfolio_id", "integer")
			.addColumn("user_id", "integer")
			.addPrimaryKeyConstraint("owns_primary", ["portfolio_id"])
			.addForeignKeyConstraint(
				"owns_foreign1",
				["portfolio_id"],
				"portfolios",
				["id"],
			)
			.addForeignKeyConstraint("owns_foreign2", ["user_id"], "users", ["id"])
			.execute();

		const createInvestmentsTable = db.schema
			.createTable("investments")
			.addColumn("portfolio_id", "integer")
			.addColumn("stock_symbol", "varchar(10)")
			.addColumn("stock_date", "date")
			.addColumn("num_shares", "integer")
			.addPrimaryKeyConstraint("investment_primary", [
				"portfolio_id",
				"stock_symbol",
				"stock_date",
			])
			.addForeignKeyConstraint(
				"investment_foreign1",
				["portfolio_id"],
				"portfolios",
				["id"],
			)
			.addForeignKeyConstraint(
				"investment_foreign2",
				["stock_symbol"],
				"stocks",
				["stock_symbol"],
			)
			.execute();

		const createAccessTable = db.schema
			.createTable("access")
			.addColumn("user_id", "integer")
			.addColumn("stock_list_id", "integer")
			.addColumn("is_owner", "boolean")
			.addPrimaryKeyConstraint("access_primary", ["user_id", "stock_list_id"])
			.addForeignKeyConstraint("access_foreign1", ["user_id"], "users", ["id"])
			.addForeignKeyConstraint(
				"access_foreign2",
				["stock_list_id"],
				"stocks_list",
				["id"],
			)
			.execute();

		const createContainsTable = db.schema
			.createTable("contains")
			.addColumn("stock_list_id", "integer")
			.addColumn("stock_symbol", "varchar(10)")
			.addColumn("num_shares", "integer", (col) => col.defaultTo(0))
			.addPrimaryKeyConstraint("contains_primary", [
				"stock_list_id",
				"stock_symbol",
			])
			.addForeignKeyConstraint(
				"contains_foreign1",
				["stock_list_id"],
				"stocks_list",
				["id"],
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
			createRequestTimeoutTable,
			createOwnsTable,
			createInvestmentsTable,
			createAccessTable,
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
}
