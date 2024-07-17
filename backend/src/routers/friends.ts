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
			if (!req.user || !req.user.id) {
			}
			if (!req.user) {
				return res.status(403).json({ error: "No token provided" });
			}
			const requestingFriend = +req.user?.id;

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
			res.status(500).json("Could not create friend request");
		}
	},
);

export default friendsRouter;
