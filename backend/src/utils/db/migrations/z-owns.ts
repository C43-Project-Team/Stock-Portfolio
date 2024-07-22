import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// Drop the existing owns table if it exists
	await db.schema.dropTable("owns").ifExists().execute();

	// Create the new owns table with the updated schema
	await db.schema
		.createTable("owns")
		.addColumn("portfolio_id", "integer")
		.addColumn("user_id", "varchar(20)")
		.addPrimaryKeyConstraint("owns_primary", ["portfolio_id"])
		.addForeignKeyConstraint("owns_foreign1", ["portfolio_id"], "portfolios", [
			"id",
		])
		.addForeignKeyConstraint("owns_foreign2", ["user_id"], "users", [
			"username",
		])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	// Drop the new owns table
	await db.schema.dropTable("owns").execute();

	// Recreate the old owns table if needed
	await db.schema
		.createTable("owns")
		.addColumn("portfolio_id", "integer")
		.addColumn("user_id", "integer")
		.addPrimaryKeyConstraint("owns_primary", ["portfolio_id"])
		.addForeignKeyConstraint("owns_foreign1", ["portfolio_id"], "portfolios", [
			"id",
		])
		.addForeignKeyConstraint("owns_foreign2", ["user_id"], "users", ["id"])
		.execute();
}
