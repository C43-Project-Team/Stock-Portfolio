import { Router } from "express";
import bcrypt from "bcrypt";
import { userDatabase } from "../database/UserDatabase";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { verifyToken } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
	try {
		const { fullName, username, password } = req.body;
		const passwordHash = await bcrypt.hash(password, 10);
		const newUser = await userDatabase.createUser(
			username,
			passwordHash,
			fullName,
		);
		res.json(newUser);
	} catch (error) {
		return res.status(500).json({ error: "Error signing up" });
	}
});

authRouter.post("/signin", async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await userDatabase.getUserByUsername(username);
		if (!user) {
			return res.status(400).json({ error: "Invalid credentials" });
		}
		const isPasswordCorrect = await bcrypt.compare(
			password,
			user.password_hash,
		);
		if (!isPasswordCorrect) {
			return res.status(400).json({ error: "Invalid credentials" });
		}
		const token = jwt.sign(
			{ id: user.id, username: user.username },
			process.env.JWT_SECRET || "stockms",
		);
		return res.json({ token });
	} catch (error) {
		res.status(500).json({ error: "Error logging in" });
	}
});

authRouter.get("/me", verifyToken, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

