import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// Drop the existing reviews table if it exists
	await db.schema.dropTable("reviews").ifExists().execute();

	// Create the new reviews table with the updated schema
	await db.schema
		.createTable("reviews")
		.addColumn("user_id", "varchar(20)")
		.addColumn("stock_list_id", "integer")
		.addColumn("content", "varchar(200)")
		.addColumn("review_creation_time", "timestamp", (col) =>
			col.defaultTo(sql`now()`).notNull(),
		)
		.addColumn("review_last_updated", "timestamp")
		.addPrimaryKeyConstraint("review_primary", ["user_id", "stock_list_id"])
		.addForeignKeyConstraint("review_user_foreign1", ["user_id"], "users", [
			"username",
		])
		.addForeignKeyConstraint(
			"review_user_foreign2",
			["stock_list_id"],
			"stocks_list",
			["id"],
		)
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	// Drop the new reviews table
	await db.schema.dropTable("reviews").execute();

	// Recreate the old reviews table if needed
	await db.schema
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
}
