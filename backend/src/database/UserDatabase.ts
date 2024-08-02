import { db } from "@utils/db/db-controller"; // Adjust the import path accordingly
import type { Database, User } from "../types/db-schema";
import type { Kysely } from "kysely";

class UserDatabase {
	private db: Kysely<Database>;

	constructor() {
		this.db = db;
	}

    /**
     * select * from users 
     * where username = username 
     * limit 1;
     */
	async getUserByUsername(username: string): Promise<User | null> {
		const user = await this.db
			.selectFrom("users")
			.selectAll()
			.where("username", "=", username)
			.executeTakeFirst();

		return user || null;
	}

    /**
     * insert into users (username, password_hash, full_name, user_created_at, profile_picture)
     * values (username, password_hash, full_name, new Date(), profile_picture)
     * returning username, password_hash, full_name, user_created_at, profile_picture;
     */
	async createUser(
		username: string,
		password_hash: string,
		full_name: string,
		profile_picture: string,
	): Promise<User> {
		const [user] = await this.db
			.insertInto("users")
			.values({
				username,
				password_hash,
				full_name,
				user_created_at: new Date(),
				profile_picture,
			})
			.returning([
				"username",
				"password_hash",
				"full_name",
				"user_created_at",
				"profile_picture",
			])
			.execute();

		return user;
	}

    /**
     * select * from users
     * where username like 'query%';
     */
	async searchUsersByUsername(query: string): Promise<User[]> {
		return await this.db
			.selectFrom("users")
			.selectAll()
			.where("username", "like", `${query}%`)
			.execute();
	}
}

export const userDatabase = new UserDatabase();
