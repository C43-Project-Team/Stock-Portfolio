import type { Request, Response, NextFunction } from "express";
import jwt  from "jsonwebtoken";
import "dotenv/config"

interface DecodedToken {
  id: string;
  username: string;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }
  jwt.verify(token, process.env.JWT_SECRET || "stockms", (err, decoded) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to authenticate token' });
    }
    req.user = decoded as DecodedToken;
    next();
  });
};