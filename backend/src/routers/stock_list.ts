import { stockListDatabase } from "@/database/StockListDatabase";
import { type AuthedRequest, verifyToken } from "@/middleware/auth";
import { Router, type Response } from "express";
import { re } from "mathjs";
import { reviewRouter } from "./review";
import { portfolioDatabase } from "@/database/PortfolioDatabase";

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

// Get stocks in a list
stockListRouter.get(
	"/:username/:stock_list_name/stocks",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const me = req.user?.username;
			if (!me) {
				return res.status(400).json({ error: "Username not found" });
			}
			const { username, stock_list_name } = req.params;

			if (!username || !stock_list_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const hasAccess = await stockListDatabase.hasAccess(
				me,
				username,
				stock_list_name,
			);
			if (!hasAccess) {
				return res.status(403).json({ error: "Access denied" });
			}

			const stocks = await stockListDatabase.getStocksInList(
				username,
				stock_list_name,
			);
			res.json(stocks);
		} catch (error) {
			return res.status(500).json({ error: "Error retrieving stocks in list" });
		}
	},
);

stockListRouter.get(
	"/:username/:stock_list_name/has-access",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const authenticatedUser = req.user?.username;
			const { username, stock_list_name } = req.params;

			if (!authenticatedUser) {
				return res.status(400).json({ error: "Authenticated user not found" });
			}

			if (!username || !stock_list_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const hasAccess = await stockListDatabase.hasAccess(
				authenticatedUser,
				username,
				stock_list_name,
			);

			res.json(hasAccess);
		} catch (error) {
			return res.status(500).json({ error: "Error checking access" });
		}
	},
);

stockListRouter.get(
	"/private-shared",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const authenticatedUser = req.user?.username;

			if (!authenticatedUser) {
				return res.status(400).json({ error: "Authenticated user not found" });
			}

			const privateStockLists =
				await stockListDatabase.getAllPrivateStockListsSharedWithUser(
					authenticatedUser,
				);

			res.json(privateStockLists);
		} catch (error) {
			return res
				.status(500)
				.json({ error: "Error retrieving private stock lists" });
		}
	},
);

stockListRouter.get(
	"/:stock_list_name/search-unshared-friends",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const { stock_list_name } = req.params;
			const { query } = req.query;
			const owner = req.user?.username;

			if (!owner) {
				return res.status(400).json({ error: "Username not found" });
			}

			if (!query || typeof query !== "string") {
				return res.status(400).json({ error: "Query parameter is required" });
			}

			const users = await stockListDatabase.searchUnsharedFriends(
				owner,
				stock_list_name,
				query,
			);

			res.json({ users });
		} catch (error) {
			return res.status(500).json({ error: "Error searching for users" });
		}
	},
);

// Check if a stock list is private
stockListRouter.get(
	"/:username/:stock_list_name/is-private",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const { username, stock_list_name } = req.params;

			if (!username || !stock_list_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const stockList = await stockListDatabase.getStockList(
				username,
				stock_list_name,
			);
			if (!stockList) {
				return res.status(404).json({ error: "Stock list not found" });
			}

			return res.json(stockList.private);
		} catch (error) {
			return res
				.status(500)
				.json({ error: "Error checking stock list privacy" });
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
			console.log(error);
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
			res.json({ users: sharedUsers });
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

			const isFriend = await stockListDatabase.isFriend(owner, user);
			if (!isFriend) {
				return res.status(400).json({ error: "Can only share with friends" });
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

stockListRouter.post(
	"/:stock_list_name/revoke",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const owner = req.user?.username;
			const { stock_list_name } = req.params;
			const { user } = req.body;

			if (!owner || !user) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			await stockListDatabase.revokeSharing(owner, stock_list_name, user);
			return res.json({ message: "Sharing revoked successfully" });
		} catch (error) {
			return res.status(500).json({ error: "Error revoking sharing" });
		}
	},
);

stockListRouter.post(
	"/stockList-beta",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		const { owner, stockList_name } = req.body;
		try {
			if (!owner || !stockList_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const stockListBeta = await stockListDatabase.stockListBeta(
				owner,
				stockList_name,
			);

			res.json({ stock_list_beta: stockListBeta });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving portfolio beta" });
		}
	},
);

stockListRouter.post(
	"/stockList-beta-range",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		const { owner, stockList_name, startDate, endDate } = req.body;
		try {
			const stockListBeta = await stockListDatabase.stockListBetaRange(
				owner,
				stockList_name,
				startDate,
				endDate,
			);

			if (!owner || !stockList_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			res.json({ stock_list_beta: stockListBeta });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving portfolio beta" });
		}
	},
);

stockListRouter.use(
	"/:stock_list_owner/:stock_list_name/reviews",
	(req, res, next) => {
		next();
	},
	reviewRouter,
);


stockListRouter.post(
	"/stock-covariance",
	async (req: AuthedRequest, res: Response) => {
		try {
			const { owner, stock_list } = req.body;
			if (!owner || !stock_list) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const lists = await stockListDatabase.getStockListContains(
				owner,
				stock_list,
			);

			const stocks = lists.map((list) => list.stock_symbol);
			const stockCovariances = await portfolioDatabase.stockCovariance(stocks);

			res.json({ stock_covariances: stockCovariances });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving stock correlations" });
		}
	},
);

stockListRouter.post(
	"/stock-covariance-date-range",
	async (req: AuthedRequest, res: Response) => {
		try {
			const { owner, stock_list_name, startDate, endDate } = req.body;
			if (!owner || !stock_list_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const lists = await stockListDatabase.getStockListContains(
				owner,
				stock_list_name,
			);

			const stocks = lists.map((list) => list.stock_symbol);
			const stockCovariances = await portfolioDatabase.stockCovarianceRange(
				stocks,
				startDate,
				endDate,
			);

			res.json({ stock_covariances: stockCovariances });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving stock correlations" });
		}
	},
);

stockListRouter.post(
	"/stock-correlations",
	async (req: AuthedRequest, res: Response) => {
		try {
			const { owner, stock_list_name } = req.body;
			if (!owner || !stock_list_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const lists = await stockListDatabase.getStockListContains(
				owner,
				stock_list_name,
			);
			const stocks = lists.map((list) => list.stock_symbol);
			const stockCorrelations =
				await portfolioDatabase.stockCorrelations(stocks);

			res.json({ stock_correlations: stockCorrelations });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving stock correlations" });
		}
	},
);

stockListRouter.post(
	"/stock-correlations-date-range",
	async (req: AuthedRequest, res: Response) => {
		try {
			const { owner, stock_list_name, startDate, endDate } = req.body;
			if (!owner || !stock_list_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const lists = await stockListDatabase.getStockListContains(
				owner,
				stock_list_name,
			);
			const stocks = lists.map((list) => list.stock_symbol);
			const stockCorrelations = await portfolioDatabase.stockCorrelationsRange(
				stocks,
				startDate,
				endDate,
			);

			res.json({ stock_correlations: stockCorrelations });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving stock correlations" });
		}
	},
);