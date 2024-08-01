import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// Drop the existing access table if it exists
	await db.schema.dropTable("access").ifExists().execute();

	// Create the new private_access table with the updated schema
	await db.schema
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
}

export async function down(db: Kysely<any>): Promise<void> {
	// Drop the new private_access table
	await db.schema.dropTable("private_access").execute();

	// Recreate the old access table if needed
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
