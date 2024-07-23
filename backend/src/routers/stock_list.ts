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
	"/private-shared",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const username = req.user?.username;
			if (!username) {
				return res.status(400).json({ error: "Username not found" });
			}

			const privateStockLists =
				await stockListDatabase.getPrivateStockListsSharedWithUser(username);
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
	"/public",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const publicStockLists = await stockListDatabase.getPublicStockLists();
			res.json(publicStockLists);
		} catch (error) {
			return res
				.status(500)
				.json({ error: "Error retrieving public stock lists" });
		}
	},
);
