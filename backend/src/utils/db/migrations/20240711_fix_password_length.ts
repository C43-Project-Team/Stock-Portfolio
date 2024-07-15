import { type Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: Kysely needs to be passed the "any" type here
async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("new_password_hash", "varchar(60)", (col) => col.notNull())
    .execute();

  await db
    .updateTable("users")
    .set({
      new_password_hash: sql`password_hash`,
    })
    .execute();

  await db.schema
    .alterTable("users")
    .dropColumn("password_hash")
    .execute();

  await db.schema
    .alterTable("users")
    .renameColumn("new_password_hash", "password_hash")
    .execute();
}

// biome-ignore lint/suspicious/noExplicitAny: Kysely needs to be passed the "any" type here
async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("old_password_hash", "varchar(20)", (col) => col.notNull())
    .execute();

  await db
    .updateTable("users")
    .set({
      old_password_hash: sql`password_hash`,
    })
    .execute();

  await db.schema
    .alterTable("users")
    .dropColumn("password_hash")
    .execute();

  await db.schema
    .alterTable("users")
    .renameColumn("old_password_hash", "password_hash")
    .execute();
}

export { up, down };