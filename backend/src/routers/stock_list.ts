import { stockListDatabase } from "@/database/StockListDatabase";
import { type AuthedRequest, verifyToken } from "@/middleware/auth";
import { Router, type Response } from "express";

export const stockListRouter = Router();

// all stock lists that the user owns
stockListRouter.get(
	"/",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const username = req.user?.username;
			if (!username) {
				return res.status(400).json({ error: "Username not found" });
			}

			const stockLists = await stockListDatabase.getUserStockLists(username);
			res.json(stockLists);
		} catch (error) {
			return res.status(500).json({ error: "Error retrieving stock lists" });
		}
	},
);

// create
stockListRouter.post(
	"/create",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const { stock_list_name, private: isPrivate } = req.body;
			const owner = req.user?.username;

			if (!owner || !stock_list_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const stockList = await stockListDatabase.createStockList(
				owner,
				stock_list_name,
				isPrivate,
			);
			return res.json(stockList);
		} catch (error) {
			if (error instanceof Error && error.message.includes("already exists")) {
				return res.status(400).json({ error: error.message });
			}
			return res.status(500).json({ error: "Error creating stock list" });
		}
	},
);

stockListRouter.get(
	"/private-shared/:username",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const authenticatedUsername = req.user?.username;
			const { username } = req.params;

			if (!authenticatedUsername) {
				return res.status(400).json({ error: "Authenticated user not found" });
			}

			if (!username) {
				return res.status(400).json({ error: "Username parameter missing" });
			}

			const privateStockLists =
				await stockListDatabase.getPrivateStockListsSharedWithUser(
					authenticatedUsername,
					username,
				);

			res.json(privateStockLists);
		} catch (error) {
			return res
				.status(500)
				.json({ error: "Error retrieving private stock lists" });
		}
	},
);

stockListRouter.delete(
	"/delete",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const { stock_list_name } = req.body;
			const owner = req.user?.username;

			if (!owner || !stock_list_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			await stockListDatabase.deleteStockList(owner, stock_list_name);
			return res.json({ message: "Stock list deleted successfully" });
		} catch (error) {
			return res.status(500).json({ error: "Error deleting stock list" });
		}
	},
);

stockListRouter.get(
	"/public/:username",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const username = req.params.username;
			const publicStockLists =
				await stockListDatabase.getUserPublicStockLists(username);
			res.json(publicStockLists);
		} catch (error) {
			return res
				.status(500)
				.json({ error: "Error retrieving user's public stock lists" });
		}
	},
);

stockListRouter.get(
	"/public",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const limit = Number.parseInt(req.query.limit as string) || 10;
			const page = Number.parseInt(req.query.page as string) || 1;
			const offset = (page - 1) * limit;

			const publicStockLists = await stockListDatabase.getPublicStockLists(
				limit,
				offset,
			);
			res.json(publicStockLists);
		} catch (error) {
			return res
				.status(500)
				.json({ error: "Error retrieving public stock lists" });
		}
	},
);

stockListRouter.get(
	"/public/count",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const count = await stockListDatabase.getPublicStockListCount();
			res.json({ count });
		} catch (error) {
			return res
				.status(500)
				.json({ error: "Error retrieving public stock list count" });
		}
	},
);
