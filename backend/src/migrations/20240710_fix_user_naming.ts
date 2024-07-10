import { type Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: Kysely needs to be passed the "any" type here
async function up(db: Kysely<any>): Promise<void> {
	// Add the new column
	await db.schema
		.alterTable("users")
		.addColumn("full_name", "varchar(40)", (col) => col.notNull())
		.execute();

	// Update the new column with concatenated values of first_name and surname
	await db
		.updateTable("users")
		.set({
			full_name: sql<string>`first_name || ' ' || surname`,
		})
		.execute();

	// Drop the old columns
	await db.schema
		.alterTable("users")
		.dropColumn("first_name")
		.dropColumn("surname")
		.execute();
}

// biome-ignore lint/suspicious/noExplicitAny: Kysely needs to be passed the "any" type here
async function down(db: Kysely<any>): Promise<void> {
	// Add the old columns back
	await db.schema
		.alterTable("users")
		.addColumn("first_name", "varchar(20)")
		.addColumn("surname", "varchar(20)")
		.execute();

	// Split full_name back into first_name and surname
	// This is a simplistic split and might need adjustment based on your data
	await db
		.updateTable("users")
		.set({
			first_name: sql<string>`split_part(full_name, ' ', 1)`,
			surname: sql<string>`split_part(full_name, ' ', 2)`,
		})
		.execute();

	// Drop the new column
	await db.schema.alterTable("users").dropColumn("full_name").execute();
}

export { up, down };
