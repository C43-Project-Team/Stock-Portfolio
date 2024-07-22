import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

interface DecodedToken {
	id: string;
	username: string;
}

export interface AuthedRequest extends Request {
	user?: DecodedToken; // Make it optional or required based on your use case
}

export const verifyToken = (
	req: AuthedRequest,
	res: Response,
	next: NextFunction,
) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(403).json({ error: "No token provided" });
	}
	const token = authHeader.split(" ")[1];
	jwt.verify(token, process.env.JWT_SECRET || "stockms", (err, decoded) => {
		if (err) {
			return res.status(500).json({ error: "Failed to authenticate token" });
		}
		req.user = decoded as DecodedToken;
		next();
	});
};
