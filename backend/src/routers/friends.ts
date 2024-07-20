import express from "express";
import { friendsDatabase } from "@database/FriendsDatabase"; // Adjust the import path accordingly
import { verifyToken } from "@middleware/auth"; // Adjust the import path accordingly
import type { Request, Response } from "express";
import type { AuthedRequest } from "@middleware/auth"; // Adjust the import path accordingly

const friendsRouter = express.Router();

friendsRouter.post(
	"/request",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const friend = +req.body.friend;

			const requestingFriend = req.user ? +req.user.id : null;

			if (!friend || !requestingFriend) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			if (!friend || !requestingFriend) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			if (requestingFriend === friend) {
				return res
					.status(400)
					.json({ error: "Cannot be friends with yourself" });
			}

			const newFriendRequest = await friendsDatabase.createFriendRequest(
				requestingFriend,
				friend,
			);

			return res.json(newFriendRequest);
		} catch (error) {
			if (
				error instanceof Error &&
				error.message ===
					"You cannot send a friend request at this time. Please try again later."
			) {
				return res.status(403).json({ error: error.message });
			}
			res.status(500).json("Could not create friend request");
		}
	},
);

friendsRouter.post(
	"/accept",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const friend = +req.body.friend;

			const receivingFriend = req.user ? +req.user.id : null;

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
			const friend = +req.body.friend;
			const requestingFriend = req.user ? +req.user.id : null;

			if (!friend || !requestingFriend) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			await friendsDatabase.removeFriend(requestingFriend, friend);

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
			const userId = req.user ? +req.user.id : null;

			if (!userId) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const connections = await friendsDatabase.getConnections(userId);
			const incomingRequests =
				await friendsDatabase.getIncomingRequests(userId);

			return res.json({ connections, incomingRequests });
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Could not fetch connections" });
		}
	},
);

friendsRouter.get(
	"/sent-requests",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const userId = req.user ? +req.user.id : null;

			if (!userId) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const sentRequests = await friendsDatabase.getSentRequests(userId);

			return res.json(sentRequests);
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Could not fetch sent requests" });
		}
	},
);

export default friendsRouter;
