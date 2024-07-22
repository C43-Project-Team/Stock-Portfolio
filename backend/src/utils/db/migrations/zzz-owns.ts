import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// Drop the existing owns table if it exists
	await db.schema.dropTable("owns").ifExists().execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	// In case you need to recreate the owns table (as it was before dropping)
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
