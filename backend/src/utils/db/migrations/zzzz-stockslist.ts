import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// Drop the existing stocks_list table if it exists
	await db.schema.dropTable("stocks_list").ifExists().execute();

	// Create the new stocks_list table with the updated schema
	await db.schema
		.createTable("stocks_list")
		.addColumn("owner", "varchar(20)")
		.addColumn("stock_list_name", "varchar(30)")
		.addColumn("private", "boolean")
		.addPrimaryKeyConstraint("stocks_list_pkey", ["owner", "stock_list_name"])
		.addForeignKeyConstraint("stocks_list_owner_fk", ["owner"], "users", [
			"username",
		])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	// Drop the new stocks_list table
	await db.schema.dropTable("stocks_list").execute();

	// Recreate the old stocks_list table if needed
	await db.schema
		.createTable("stocks_list")
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("private", "boolean")
		.addColumn("stock_list_name", "varchar(30)")
		.execute();
}
