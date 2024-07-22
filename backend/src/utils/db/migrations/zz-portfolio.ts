import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// Drop the existing portfolios table if it exists
	await db.schema.dropTable("portfolios").ifExists().execute();

	// Create the new portfolios table with the updated schema
	await db.schema
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
}

export async function down(db: Kysely<any>): Promise<void> {
	// Drop the new portfolios table
	await db.schema.dropTable("portfolios").execute();

	// Recreate the old portfolios table if needed
	await db.schema
		.createTable("portfolios")
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("portfolio_name", "varchar(30)")
		.addColumn("cash", "decimal(18, 2)")
		.addColumn("portfolio_created_at", "timestamp", (col) =>
			col.defaultTo(sql`now()`).notNull(),
		)
		.execute();
}
