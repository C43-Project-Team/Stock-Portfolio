import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	// Drop the existing request_timeout table if it exists
	await db.schema.dropTable("request_timeout").ifExists().execute();

	// Create the new request_timeout table with the updated schema
	await db.schema
		.createTable("request_timeout")
		.addColumn("request_user", "varchar(20)")
		.addColumn("receive_user", "varchar(20)")
		.addColumn("expiry_time", "timestamp")
		.addPrimaryKeyConstraint("request_primary", [
			"request_user",
			"receive_user",
		])
		.addForeignKeyConstraint(
			"request_user_foreign1",
			["request_user"],
			"users",
			["username"],
		)
		.addForeignKeyConstraint(
			"request_user_foreign2",
			["receive_user"],
			"users",
			["username"],
		)
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	// Drop the new request_timeout table
	await db.schema.dropTable("request_timeout").execute();

	// Recreate the old request_timeout table if needed
	await db.schema
		.createTable("request_timeout")
		.addColumn("request_user", "integer")
		.addColumn("receive_user", "integer")
		.addColumn("expiry_time", "timestamp")
		.addPrimaryKeyConstraint("request_primary", [
			"request_user",
			"receive_user",
		])
		.addForeignKeyConstraint(
			"request_user_foreign1",
			["request_user"],
			"users",
			["id"],
		)
		.addForeignKeyConstraint(
			"request_user_foreign2",
			["receive_user"],
			"users",
			["id"],
		)
		.execute();
}
