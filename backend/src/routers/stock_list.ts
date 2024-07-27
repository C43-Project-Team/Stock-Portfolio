import { stockListDatabase } from "@/database/StockListDatabase";
import { type AuthedRequest, verifyToken } from "@/middleware/auth";
import { Router, type Response } from "express";
import { re } from "mathjs";
import { reviewRouter } from "./review";

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
	"/public/user/:username",
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
			console.log(error);
			return res
				.status(500)
				.json({ error: "Error retrieving public stock list count" });
		}
	},
);

stockListRouter.patch(
	"/toggle-visibility",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const { stock_list_name } = req.body;
			const owner = req.user?.username;

			if (!owner || !stock_list_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const updatedStockList =
				await stockListDatabase.toggleStockListVisibility(
					owner,
					stock_list_name,
				);

			return res.json(updatedStockList);
		} catch (error) {
			if (error instanceof Error && error.message.includes("does not exist")) {
				return res.status(404).json({ error: error.message });
			}
			return res
				.status(500)
				.json({ error: "Error toggling stock list visibility" });
		}
	},
);

// Add a stock to a list
stockListRouter.post(
	"/:stock_list_name/add",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const owner = req.user?.username;
			const { stock_list_name } = req.params;
			const { stock_symbol, num_shares } = req.body;

			if (!owner || !stock_list_name || !stock_symbol || num_shares == null) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			await stockListDatabase.addStockToList(
				owner,
				stock_list_name,
				stock_symbol,
				num_shares,
			);
			return res.json({ message: "Stock added to list successfully" });
		} catch (error) {
			return res.status(500).json({ error: "Error adding stock to list" });
		}
	},
);

// Remove a number of shares from a stock in a list
stockListRouter.post(
	"/:stock_list_name/remove-shares",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const owner = req.user?.username;
			const { stock_list_name } = req.params;
			const { stock_symbol, num_shares } = req.body;

			if (!owner || !stock_list_name || !stock_symbol || num_shares == null) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			await stockListDatabase.removeSharesFromStockList(
				owner,
				stock_list_name,
				stock_symbol,
				num_shares,
			);
			return res.json({
				message: "Shares removed from stock in list successfully",
			});
		} catch (error) {
			if (error instanceof Error && error.message === "Insufficient shares") {
				return res.status(400).json({ error: error.message });
			}
			return res
				.status(500)
				.json({ error: "Error removing shares from stock in list" });
		}
	},
);

// Delete a stock from a list
stockListRouter.post(
	"/:stock_list_name/delete-stock",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const owner = req.user?.username;
			const { stock_list_name } = req.params;
			const { stock_symbol } = req.body;

			if (!owner || !stock_list_name || !stock_symbol) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			await stockListDatabase.deleteStockFromList(
				owner,
				stock_list_name,
				stock_symbol,
			);
			return res.json({ message: "Stock deleted from list successfully" });
		} catch (error) {
			return res.status(500).json({ error: "Error deleting stock from list" });
		}
	},
);

stockListRouter.get(
	"/:stock_list_name/shared-users",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const owner = req.user?.username;
			const { stock_list_name } = req.params;

			if (!owner) {
				return res.status(400).json({ error: "Username not found" });
			}

			const sharedUsers = await stockListDatabase.getSharedUsers(
				owner,
				stock_list_name,
			);
			res.json(sharedUsers);
		} catch (error) {
			if (error instanceof Error) {
				return res.status(500).json({ error: error.message });
			}
			return res.status(500).json({ error: "Error retrieving shared users" });
		}
	},
);

stockListRouter.post(
	"/:stock_list_name/share",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const owner = req.user?.username;
			const { stock_list_name } = req.params;
			const { user } = req.body;

			if (!owner) {
				return res.status(400).json({ error: "Username not found" });
			}

			if (!user) {
				return res.status(400).json({ error: "Missing user parameter" });
			}

			await stockListDatabase.shareStockList(owner, stock_list_name, user);
			res.json({ message: "Stock list shared successfully" });
		} catch (error) {
			if (error instanceof Error) {
				return res.status(404).json({ error: error.message });
			}
			return res.status(500).json({ error: "Error sharing stock list" });
		}
	},
);

stockListRouter.use(
	"/:stock_list_owner/:stock_list_name/reviews",
	reviewRouter,
);
