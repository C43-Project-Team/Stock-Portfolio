import { db } from "../utils/db/db-controller"; // Adjust the import path accordingly
import type { Database, Friend } from "../types/db-schema";
import type { Kysely } from "kysely";

class FriendsDatabase {
	private db: Kysely<Database>;

	constructor() {
		this.db = db;
	}

	async createFriendRequest(
		requestingFriend: number,
		friend: number,
	): Promise<Friend | null | undefined> {
		const existingRequest = await this.db
			.selectFrom("friends")
			.selectAll()
			.where((eb) =>
				eb.or([
					eb.and([
						eb("friend1", "=", requestingFriend),
						eb("friend2", "=", friend),
					]),
					eb.and([
						eb("friend1", "=", friend),
						eb("friend2", "=", requestingFriend),
					]),
				]),
			)
			.executeTakeFirst();

		if (existingRequest) {
			if (existingRequest.pending) {
				throw new Error("Friend request already exists");
			}
			throw new Error("You are already friends");
		}

		const newFriendRequest = await this.db
			.insertInto("friends")
			.values({
				friend1: requestingFriend,
				friend2: friend,
				requesting_friend: requestingFriend,
				pending: true,
			})
			.returningAll()
			.executeTakeFirst();

		return newFriendRequest;
	}
}

export const friendsDatabase = new FriendsDatabase();
