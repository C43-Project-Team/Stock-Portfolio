import { db } from "@utils/db/db-controller"; // Adjust the import path accordingly
import type { Database, Friend, User } from "../types/db-schema";
import { sql, type Kysely } from "kysely";

class FriendsDatabase {
	private db: Kysely<Database>;

	constructor() {
		this.db = db;
	}

	async createFriendRequest(
		requestingFriend: string,
		receivingFriend: string,
	): Promise<Friend | null | undefined> {
		const now = new Date();

        /**
         * select * from request_timeout 
         * where request_user = requestingFriend and receive_user = receivingFriend and expiry_time > now()
         * limit 1;
         */
		const activeTimeout = await this.db
			.selectFrom("request_timeout")
			.selectAll()
			.where((eb) =>
				eb.and([
					eb("request_user", "=", requestingFriend),
					eb("receive_user", "=", receivingFriend),
					eb("expiry_time", ">", now.toISOString()), // might be buggy rn bc its not a string and in the db its stored as a string
				]),
			)
			.executeTakeFirst();

		if (activeTimeout) {
			throw new Error(
				`Timeout for friend request has not expired. Expires at ${activeTimeout.expiry_time}`,
			);
		}

        /**
         * select * from friends 
         * where (requesting_friend = requestingFriend and receiving_friend = receivingFriend) or (receiving_friend = requestingFriend and requesting_friend = receivingFriend)
         * limit 1;
         */
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

        /**
         * insert into friends (requesting_friend, receiving_friend, pending)
         * values (requestingFriend, receivingFriend, true)
         * returning *;
         */
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

    /**
     * update friends 
     * set pending = false
     * where requesting_friend = requestingFriend and receiving_friend = receivingFriend
     */
	async acceptFriendRequest(
		requestingFriend: string,
		receivingFriend: string,
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

    /**
     * delete from friends
     * where (requesting_friend = requestingFriend and receiving_friend = receivingFriend) or (receiving_friend = requestingFriend and requesting_friend = receivingFriend)
     */
	async removeFriend(
		requestingFriend: string,
		receivingFriend: string,
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

        /**
         * select * from request_timeout
         * where request_user = requestingFriend and receive_user = receivingFriend
         * limit 1;
         */
		// Check if a timeout already exists
		const existingTimeout = await this.db
			.selectFrom("request_timeout")
			.selectAll()
			.where((eb) =>
				eb.and([
					eb("request_user", "=", requestingFriend),
					eb("receive_user", "=", receivingFriend),
				]),
			)
			.executeTakeFirst();

		if (existingTimeout) {
            /**
             * update request_timeout
             * set expiry_time = expiryTime
             * where request_user = requestingFriend and receive_user = receivingFriend;
             */
			// Update the existing timeout
			await this.db
				.updateTable("request_timeout")
				// @ts-ignore
				.set({ expiry_time: expiryTime })
				.where((eb) =>
					eb.and([
						eb("request_user", "=", requestingFriend),
						eb("receive_user", "=", receivingFriend),
					]),
				)
				.execute();
		} else {
            /**
             * insert into request_timeout (request_user, receive_user, expiry_time)
             * values (requestingFriend, receivingFriend, expiryTime);
             */
			// Insert a new timeout
			await this.db
				.insertInto("request_timeout")
				.values({
					request_user: requestingFriend,
					receive_user: receivingFriend,
					expiry_time: expiryTime,
				})
				.execute();
		}
	}

    /**
     * select * from users
     * where username != username and username like 'query%' and not exists (
     *    select requesting_friend from friends
     *    where (requesting_friend = username and receiving_friend = users.username) or (receiving_friend = username and requesting_friend = users.username)
     * );
     */
	async searchForNewFriends(username: string, query: string): Promise<User[]> {
		const results = await this.db
			.selectFrom("users")
			.selectAll()
			.where("username", "!=", username)
			.where("username", "like", `${query}%`)
			.where((eb) =>
				eb.not(
					eb.exists(
						this.db
							.selectFrom("friends")
							.select("requesting_friend")
							.where((subEb) =>
								subEb.or([
									subEb.and([
										subEb("requesting_friend", "=", username),
										subEb("receiving_friend", "=", eb.ref("users.username")),
									]),
									subEb.and([
										subEb("receiving_friend", "=", username),
										subEb("requesting_friend", "=", eb.ref("users.username")),
									]),
								]),
							),
					),
				),
			)
			.execute();

		return results;
	}

    /**
     * delete from friends
     * where (requesting_friend = requestingFriend and receiving_friend = receivingFriend) or (receiving_friend = requestingFriend and requesting_friend = receivingFriend);
     */
	async withdrawFriendRequest(
		requestingFriend: string,
		receivingFriend: string,
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
	}

    /**
     * select * from friends
     * where (requesting_friend = username or receiving_friend = username) and pending = false;
     */
	async getConnections(username: string): Promise<Friend[]> {
		return this.db
			.selectFrom("friends")
			.selectAll()
			.where((eb) =>
				eb.and([
					eb.or([
						eb("requesting_friend", "=", username),
						eb("receiving_friend", "=", username),
					]),
					eb("pending", "=", false),
				]),
			)
			.execute();
	}

    /**
     * select * from friends
     * where receiving_friend = username and pending = true;
     */
	async getIncomingRequests(username: string): Promise<Friend[]> {
		return this.db
			.selectFrom("friends")
			.selectAll()
			.where((eb) =>
				eb.and([
					eb("receiving_friend", "=", username),
					eb("pending", "=", true),
				]),
			)
			.execute();
	}

    /**
     * select * from friends
     * where requesting_friend = username and pending = true;
     */
	async getSentRequests(username: string): Promise<Friend[]> {
		return this.db
			.selectFrom("friends")
			.selectAll()
			.where((eb) =>
				eb.and([
					eb("requesting_friend", "=", username),
					eb("pending", "=", true),
				]),
			)
			.execute();
	}

    /**
     * select * from users
     * where username != username and not exists (
     *     select * from friends
     *     where (requesting_friend = username and receiving_friend = users.username)
     * ) and not exists (
     *     select * from friends 
     *     where (receiving_friend = username and requesting_friend = users.username)
     * ); 
     */
	async getNonFriends(username: string): Promise<User[]> {
		return this.db
			.selectFrom("users")
			.selectAll()
			.where("username", "!=", username)
			.where((eb) =>
				eb.not(
					eb.or([
						eb.exists(
							eb
								.selectFrom("friends")
								.where("requesting_friend", "=", username)
								.whereRef("receiving_friend", "=", "users.username"),
						),
						eb.exists(
							eb
								.selectFrom("friends")
								.where("receiving_friend", "=", username)
								.whereRef("requesting_friend", "=", "users.username"),
						),
					]),
				),
			)
			.execute();
	}
}

export const friendsDatabase = new FriendsDatabase();
