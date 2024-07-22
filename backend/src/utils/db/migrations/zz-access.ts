import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// Drop the existing access table if it exists
	await db.schema.dropTable("access").ifExists().execute();

	// Create the new access table with the updated schema
	await db.schema
		.createTable("access")
		.addColumn("user_id", "varchar(20)")
		.addColumn("stock_list_id", "integer")
		.addColumn("is_owner", "boolean")
		.addPrimaryKeyConstraint("access_primary", ["user_id", "stock_list_id"])
		.addForeignKeyConstraint("access_foreign1", ["user_id"], "users", [
			"username",
		])
		.addForeignKeyConstraint(
			"access_foreign2",
			["stock_list_id"],
			"stocks_list",
			["id"],
		)
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	// Drop the new access table
	await db.schema.dropTable("access").execute();

	// Recreate the old access table if needed
	await db.schema
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
}
