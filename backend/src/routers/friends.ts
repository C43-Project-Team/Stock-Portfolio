import express from "express";
import { friendsDatabase } from "@database/FriendsDatabase"; // Adjust the import path accordingly
import { verifyToken } from "@middleware/auth"; // Adjust the import path accordingly
import type { Request, Response } from "express";
import type { AuthedRequest } from "@middleware/auth"; // Adjust the import path accordingly
import { userDatabase } from "@/database/UserDatabase";

const friendsRouter = express.Router();

friendsRouter.post(
	"/request",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const friend = await userDatabase.getUserByUsername(req.body.friend);
			const friendUsername = friend?.username;

			const requestingFriend = req.user ? req.user.username : null;

			if (!friendUsername || !requestingFriend) {
				return res.status(400).json({ error: "User does not exist" });
			}

			if (!friendUsername || !requestingFriend) {
				return res.status(400).json({ error: "User does not exist" });
			}

			if (requestingFriend === friendUsername) {
				return res
					.status(400)
					.json({ error: "Cannot be friends with yourself" });
			}

			const newFriendRequest = await friendsDatabase.createFriendRequest(
				requestingFriend,
				friendUsername,
			);

			return res.json(newFriendRequest);
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes("Timeout for friend request")
			) {
				return res.status(403).json({ error: error.message });
			}
			return res.status(500).json({ error: "Could not send friend request" });
		}
	},
);

friendsRouter.post(
	"/accept",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const friend = req.body.friend;

			const receivingFriend = req.user ? req.user.username : null;

			if (!friend || !receivingFriend) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			await friendsDatabase.acceptFriendRequest(friend, receivingFriend);

			return res.status(200).json({ message: "Friend request accepted" });
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Could not accept friend request" });
		}
	},
);

friendsRouter.post(
	"/remove",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const friend = req.body.friend;
			const requestingFriend = req.user ? req.user.username : null;

			if (!friend || !requestingFriend) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			await friendsDatabase.removeFriend(friend, requestingFriend);

			return res.status(200).json({ message: "Friend removed successfully" });
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Could not remove friend" });
		}
	},
);

friendsRouter.get(
	"/connections",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const username = req.user ? req.user.username : null;

			if (!username) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const connections = await friendsDatabase.getConnections(username);
			const incomingRequests =
				await friendsDatabase.getIncomingRequests(username);

			return res.json({ connections, incomingRequests });
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Could not fetch connections" });
		}
	},
);

friendsRouter.post(
	"/withdraw",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const friend = req.body.friend;
			const requestingFriend = req.user ? req.user.username : null;

			if (!friend || !requestingFriend) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			await friendsDatabase.withdrawFriendRequest(requestingFriend, friend);

			return res.status(200).json({ message: "Friend request withdrawn" });
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Could not withdraw friend request" });
		}
	},
);

friendsRouter.get(
	"/sent-requests",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const username = req.user ? req.user.username : null;

			if (!username) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const sentRequests = await friendsDatabase.getSentRequests(username);

			return res.json(sentRequests);
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Could not fetch sent requests" });
		}
	},
);

friendsRouter.get(
	"/non-friends",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const username = req.user ? req.user.username : null;

			if (!username) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const nonFriends = await friendsDatabase.getNonFriends(username);

			return res.json(nonFriends);
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Could not fetch non-friends" });
		}
	},
);

export default friendsRouter;
