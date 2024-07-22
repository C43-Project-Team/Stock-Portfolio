import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// Drop the existing investments table if it exists
	await db.schema.dropTable("investments").ifExists().execute();

	// Create the new investments table with the updated schema
	await db.schema
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
}

export async function down(db: Kysely<any>): Promise<void> {
	// Drop the new investments table
	await db.schema.dropTable("investments").execute();

	// Recreate the old investments table if needed
	await db.schema
		.createTable("investments")
		.addColumn("portfolio_id", "integer")
		.addColumn("stock_symbol", "varchar(10)")
		.addColumn("num_shares", "integer")
		.addPrimaryKeyConstraint("investment_primary", [
			"portfolio_id",
			"stock_symbol",
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
}
