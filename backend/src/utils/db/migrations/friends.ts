import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// Drop the existing friends table if it exists
	await db.schema.dropTable("friends").ifExists().execute();

	// Create the new friends table with the updated schema
	await db.schema
		.createTable("friends")
		.addColumn("requesting_friend", "varchar(20)")
		.addColumn("receiving_friend", "varchar(20)")
		.addColumn("pending", "boolean")
		.addPrimaryKeyConstraint("friend_primary", [
			"requesting_friend",
			"receiving_friend",
		])
		.addForeignKeyConstraint(
			"friend_user_foreign1",
			["requesting_friend"],
			"users",
			["username"],
		)
		.addForeignKeyConstraint(
			"friend_user_foreign2",
			["receiving_friend"],
			"users",
			["username"],
		)
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	// Drop the new friends table
	await db.schema.dropTable("friends").execute();

	// Recreate the old friends table if needed
	await db.schema
		.createTable("friends")
		.addColumn("requesting_friend", "integer")
		.addColumn("receiving_friend", "integer")
		.addColumn("pending", "boolean")
		.addPrimaryKeyConstraint("friend_primary", [
			"requesting_friend",
			"receiving_friend",
		])
		.addForeignKeyConstraint(
			"friend_user_foreign1",
			["requesting_friend"],
			"users",
			["id"],
		)
		.addForeignKeyConstraint(
			"friend_user_foreign2",
			["receiving_friend"],
			"users",
			["id"],
		)
		.execute();
}
