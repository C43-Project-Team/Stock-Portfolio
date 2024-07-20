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
		receivingFriend: number,
	): Promise<Friend | null | undefined> {
		const now = new Date();

		const activeTimeout = await this.db
			.selectFrom("request_timeout")
			.selectAll()
			.where((eb) =>
				eb.and([
					eb("request_user", "=", requestingFriend),
					eb("receive_user", "=", receivingFriend),
					eb("expiry_time", ">", now), // might be buggy rn bc its not a string and in the db its stored as a string
				]),
			);

		if (activeTimeout) {
			throw new Error("Timeout for friend request has not expired");
		}

		const existingRequest = await this.db
			.selectFrom("friends")
			.selectAll()
			.where((eb) =>
				eb.or([
					eb.and([
						eb("requesting_friend", "=", requestingFriend),
						eb("receiving_friend", "=", receivingFriend),
					]),
					eb.and([
						eb("receiving_friend", "=", receivingFriend),
						eb("requesting_friend", "=", requestingFriend),
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
				requesting_friend: requestingFriend,
				receiving_friend: receivingFriend,
				pending: true,
			})
			.returningAll()
			.executeTakeFirst();

		return newFriendRequest;
	}

	async acceptFriendRequest(
		requestingFriend: number,
		receivingFriend: number,
	): Promise<void> {
		await db
			.updateTable("friends")
			.set({ pending: false })
			.where((eb) =>
				eb.and([
					eb.and([
						eb("requesting_friend", "=", requestingFriend),
						eb("receiving_friend", "=", receivingFriend),
					]),
				]),
			)
			.execute();
	}

	async removeFriend(
		requestingFriend: number,
		receivingFriend: number,
	): Promise<void> {
		await this.db
			.deleteFrom("friends")
			.where((eb) =>
				eb.or([
					eb.and([
						eb("requesting_friend", "=", requestingFriend),
						eb("receiving_friend", "=", receivingFriend),
					]),
					eb.and([
						eb("receiving_friend", "=", requestingFriend),
						eb("requesting_friend", "=", receivingFriend),
					]),
				]),
			)
			.execute();

		const expiryTime = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now

		await this.db
			.insertInto("request_timeout")
			.values({
				request_user: requestingFriend,
				receive_user: receivingFriend,
				expiry_time: expiryTime,
			})
			.execute();
	}

	async getConnections(userId: number): Promise<Friend[]> {
		return this.db
			.selectFrom("friends")
			.selectAll()
			.where((eb) =>
				eb.and([
					eb.or([
						eb("requesting_friend", "=", userId),
						eb("receiving_friend", "=", userId),
					]),
					eb("pending", "=", false),
				]),
			)
			.execute();
	}

	async getIncomingRequests(userId: number): Promise<Friend[]> {
		return this.db
			.selectFrom("friends")
			.selectAll()
			.where((eb) =>
				eb.and([eb("receiving_friend", "=", userId), eb("pending", "=", true)]),
			)
			.execute();
	}

	async getSentRequests(userId: number): Promise<Friend[]> {
		return this.db
			.selectFrom("friends")
			.selectAll()
			.where((eb) =>
				eb.and([
					eb("requesting_friend", "=", userId),
					eb("pending", "=", true),
				]),
			)
			.execute();
	}
}

export const friendsDatabase = new FriendsDatabase();
