import { portfolioDatabase } from "@/database/PortfolioDatabase";
import { type AuthedRequest, verifyToken } from "@/middleware/auth";
import { Router, type Response } from "express";
import "dotenv/config";

export const portfolioRouter = Router();

// all portfolios that the user owns
portfolioRouter.get(
	"/",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const username = req.user?.username;
			if (!username) {
				return res.status(400).json({ error: "Username not found" });
			}

			const portfolios = await portfolioDatabase.getUserPortfolios(username);
			res.json(portfolios);
		} catch (error) {
			return res.status(500).json({ error: "Error retrieving portfolios" });
		}
	},
);

// create
portfolioRouter.post(
	"/create",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const { portfolio_name, initialDeposit } = req.body;
			const owner = req.user?.username;

			if (!owner || !portfolio_name || initialDeposit == null) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const portfolio = await portfolioDatabase.createPortfolio(
				owner,
				portfolio_name,
				initialDeposit,
			);
			return res.json(portfolio);
		} catch (error) {
			if (error instanceof Error && error.message.includes("already exists")) {
				return res.status(400).json({ error: error.message });
			}
			return res.status(500).json({ error: "Error creating portfolio" });
		}
	},
);

portfolioRouter.delete(
	"/delete",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const { portfolio_name } = req.body;
			const owner = req.user?.username;

			if (!owner || !portfolio_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			await portfolioDatabase.deletePortfolio(owner, portfolio_name);
			return res.json({ message: "Portfolio deleted successfully" });
		} catch (error) {
			return res.status(500).json({ error: "Error deleting portfolio" });
		}
	},
);
