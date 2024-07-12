import { db } from "../utils/db/db-controller"; // Adjust the import path accordingly
import type { Database, User } from "../types/db-schema";
import type { Kysely } from "kysely";

class UserDatabase {
	private db: Kysely<Database>;

	constructor() {
		this.db = db;
	}

	async getUserByUsername(username: string): Promise<User | null> {
		const user = await this.db
			.selectFrom("users")
			.selectAll()
			.where("username", "=", username)
			.executeTakeFirst();

		return user || null;
	}

	async createUser(
		username: string,
		password_hash: string,
		full_name: string,
	): Promise<User> {
		const [user] = await this.db
			.insertInto("users")
			.values({
				username,
				password_hash,
				full_name,
				user_created_at: new Date(),
			})
			.returning([
				"id",
				"username",
				"password_hash",
				"full_name",
				"user_created_at",
			])
			.execute();

		return user;
	}
}

export const userDatabase = new UserDatabase();
