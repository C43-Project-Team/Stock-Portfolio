import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// Drop the existing contains table if it exists
	await db.schema.dropTable("contains").ifExists().execute();

	// Create the new contains table with the updated schema
	await db.schema
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
		.addForeignKeyConstraint("contains_foreign2", ["stock_symbol"], "stocks", [
			"stock_symbol",
		])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	// Drop the new contains table
	await db.schema.dropTable("contains").execute();

	// Recreate the old contains table if needed
	await db.schema
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
		.addForeignKeyConstraint("contains_foreign2", ["stock_symbol"], "stocks", [
			"stock_symbol",
		])
		.execute();
}
