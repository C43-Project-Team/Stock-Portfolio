import { Router, type Response } from "express";
import { userDatabase } from "@/database/UserDatabase";
import { verifyToken, type AuthedRequest } from "@/middleware/auth";
import "dotenv/config";

export const userRouter = Router();

userRouter.get(
	"/my-profile-picture",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const username = req.user?.username;
			if (!username) {
				return res.status(400).json({ error: "Username not found" });
			}

			// Fetch the user profile picture URL from the database
			const user = await userDatabase.getUserByUsername(username);
			if (!user || !user.profile_picture) {
				return res.status(404).json({ error: "Profile picture not found" });
			}

			res.json({ profilePicture: user.profile_picture });
		} catch (error) {
			return res
				.status(500)
				.json({ error: "Error retrieving profile picture" });
		}
	},
);

userRouter.get(
	"/profile-picture/:username",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const { username } = req.params;
			if (!username) {
				return res.status(400).json({ error: "Username not found" });
			}

			// Fetch the user profile picture URL from the database
			const user = await userDatabase.getUserByUsername(username);
			if (!user || !user.profile_picture) {
				return res.status(404).json({ error: "Profile picture not found" });
			}

			res.json({ profilePicture: user.profile_picture });
		} catch (error) {
			return res
				.status(500)
				.json({ error: "Error retrieving profile picture" });
		}
	},
);
