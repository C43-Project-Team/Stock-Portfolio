import { Router } from "express";
import { userDatabase } from "../database/UserDatabase";
import { type AuthedRequest, verifyToken } from "../middleware/auth";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import "dotenv/config";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "node:url";

export const authRouter = Router();

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set storage engine
const storage = multer.diskStorage({
	destination: path.resolve(__dirname, "../uploads"),
	filename: (req, file, cb) => {
		const username = req.body.username || "user";
		const timestamp = Date.now();
		const extension = path.extname(file.originalname);
		cb(null, `${username}-${timestamp}${extension}`);
	},
});

// Initialize upload
const upload = multer({
	storage: storage,
	limits: { fileSize: 1000000 },
}).single("profilePicture");

authRouter.post("/signup", upload, async (req, res) => {
	try {
		const { fullName, username, password } = req.body;
		const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

		if (!profilePicture) {
			return res.status(400).json({ error: "Profile picture is required" });
		}

		const existingUser = await userDatabase.getUserByUsername(username);
		if (existingUser) {
			return res.status(400).json({ error: "Username already exists" });
		}

		const passwordHash = await bcrypt.hash(password, 10);
		const newUser = await userDatabase.createUser(
			username,
			passwordHash,
			fullName,
			profilePicture,
		);
		const token = jwt.sign(
			{ id: newUser.id, username: newUser.username },
			process.env.JWT_SECRET || "stockms",
		);

		res.json({ user: newUser, token });
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

authRouter.get("/me", verifyToken, async (req: AuthedRequest, res) => {
	return res.json({ user: req.user });
});
