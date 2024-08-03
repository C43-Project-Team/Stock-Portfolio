import { portfolioDatabase } from "@/database/PortfolioDatabase";
import { type AuthedRequest, verifyToken } from "@/middleware/auth";
import e, { Router, type Response } from "express";
import "dotenv/config";
import { start } from "node:repl";
import { deleteKey, getObject, setObject } from "@/utils/redis/controller";

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

portfolioRouter.get(
	"/:portfolio_name",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const owner = req.user?.username;
			const { portfolio_name } = req.params;

			if (!owner || !portfolio_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const portfolio = await portfolioDatabase.getPortfolioFromName(
				owner,
				portfolio_name,
			);
			if (!portfolio) {
				return res.status(404).json({ error: "Portfolio not found" });
			}

			res.json(portfolio);
		} catch (error) {
			return res
				.status(500)
				.json({ error: "Error retrieving portfolio details" });
		}
	},
);

portfolioRouter.get(
	"/:portfolio_name/investments",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const owner = req.user?.username;
			const { portfolio_name } = req.params;

			if (!owner || !portfolio_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const investments = await portfolioDatabase.getInvestments(
				owner,
				portfolio_name,
			);
			res.json(investments);
		} catch (error) {
			return res.status(500).json({ error: "Error retrieving investments" });
		}
	},
);

portfolioRouter.post(
	"/:portfolio_name/buy",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const owner = req.user?.username;
			const { portfolio_name } = req.params;
			const { stock_symbol, num_shares } = req.body;

			if (!owner || !portfolio_name || !stock_symbol || num_shares == null) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			await portfolioDatabase.buyShares(
				owner,
				portfolio_name,
				stock_symbol,
				num_shares,
			);

			await deleteKey(`portfolio-${owner}-${portfolio_name}`);

			return res.json({ message: "Shares bought successfully" });
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === "Insufficient funds") {
					return res.status(400).json({ error: error.message });
				}
				if (error.message === "Stock not found") {
					return res.status(404).json({ error: error.message });
				}
			}
			console.log(error);
			return res.status(500).json({ error: "Error buying shares" });
		}
	},
);

portfolioRouter.post(
	"/:portfolio_name/sell",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const owner = req.user?.username;
			const { portfolio_name } = req.params;
			const { stock_symbol, num_shares } = req.body;

			if (!owner || !portfolio_name || !stock_symbol || num_shares == null) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			await portfolioDatabase.sellShares(
				owner,
				portfolio_name,
				stock_symbol,
				num_shares,
			);

			await deleteKey(`portfolio-${owner}-${portfolio_name}`);

			return res.json({ message: "Shares sold successfully" });
		} catch (error) {
			if (error instanceof Error && error.message === "Insufficient shares") {
				return res.status(400).json({ error: error.message });
			}
			return res.status(500).json({ error: "Error selling shares" });
		}
	},
);

portfolioRouter.post(
	"/:portfolio_name/deposit",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const owner = req.user?.username;
			const { portfolio_name } = req.params;
			const { amount } = req.body;

			if (!owner || !portfolio_name || amount == null) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			await portfolioDatabase.depositCash(owner, portfolio_name, amount);
			return res.json({ message: "Cash deposited successfully" });
		} catch (error) {
			return res.status(500).json({ error: "Error depositing cash" });
		}
	},
);

portfolioRouter.post(
	"/portfolio-beta",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		const { owner, portfolioName } = req.body;
		try {
			if (!owner || !portfolioName) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const cacheKey = `portfolio-${owner}-${portfolioName}`;
			const cachedData = await getObject(cacheKey);

			if (cachedData?.beta) {
				console.log("using cached data");
				return res.json({ portfolio_beta: cachedData.beta });
			}

			const portfolioBeta = await portfolioDatabase.portfolioBeta(
				owner,
				portfolioName,
			);

			console.log("portfolio beta", portfolioBeta);
			await setObject(cacheKey, { beta: portfolioBeta, ...cachedData });

			res.json({ portfolio_beta: portfolioBeta });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving portfolio beta" });
		}
	},
);

portfolioRouter.post(
	"/portfolio-beta-date-range",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		const { owner, portfolioName, startDate, endDate } = req.body;
		try {
			if (!owner || !portfolioName) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const portfolioBeta = await portfolioDatabase.portfolioBetaRange(
				owner,
				portfolioName,
				startDate,
				endDate,
			);

			res.json({ portfolio_beta: portfolioBeta });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving portfolio beta" });
		}
	},
);

portfolioRouter.post(
	"/stock-beta",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		const { stock_ticker } = req.body;

		if (!stock_ticker) {
			return res.status(400).json({ error: "Missing required parameters" });
		}

		try {
			const cacheKey = `stock-${stock_ticker}`;
			const cachedData = await getObject(cacheKey);

			if (cachedData?.beta) {
				console.log("using cached data");
				return res.json({ stock_beta: cachedData.beta });
			}

			const stockBeta = await portfolioDatabase.stockBeta(stock_ticker);

			await setObject(cacheKey, { beta: stockBeta, cov: cachedData?.cov });

			res.json({ stock_beta: stockBeta });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving stock beta and cov" });
		}
	},
);

portfolioRouter.post(
	"/stock-beta-date-range",
	async (req: AuthedRequest, res: Response) => {
		const { stockTicker, startDate, endDate } = req.body;
		try {
			const stockBeta = await portfolioDatabase.stockBetaRange(
				stockTicker,
				startDate,
				endDate,
			);

			if (!stockTicker) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			res.json({ stock_beta: stockBeta });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving stock beta" });
		}
	},
);

portfolioRouter.post(
	"/stock-correlations",
	async (req: AuthedRequest, res: Response) => {
		try {
			const { owner, portfolio_name } = req.body;
			if (!owner || !portfolio_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const cacheKey = `portfolio-${owner}-${portfolio_name}`;
			const cachedData = await getObject(cacheKey);

			if (cachedData?.correlations) {
				console.log("using cached data");
				return res.json({ stock_correlations: cachedData.correlations });
			}

			const investments = await portfolioDatabase.getInvestments(
				owner,
				portfolio_name,
			);
			const stocks = investments.map((investment) => investment.stock_symbol);
			const stockCorrelations =
				await portfolioDatabase.stockCorrelations(stocks);

			await setObject(cacheKey, {
				...cachedData,
				correlations: stockCorrelations,
			});

			res.json({ stock_correlations: stockCorrelations });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving stock correlations" });
		}
	},
);

portfolioRouter.post(
	"/stock-correlations-date-range",
	async (req: AuthedRequest, res: Response) => {
		try {
			const { owner, portfolioName, startDate, endDate } = req.body;
			if (!owner || !portfolioName) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const investments = await portfolioDatabase.getInvestments(
				owner,
				portfolioName,
			);
			const stocks = investments.map((investment) => investment.stock_symbol);
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

portfolioRouter.post(
	"/stock-covariance",
	async (req: AuthedRequest, res: Response) => {
		try {
			const { owner, portfolio_name } = req.body;
			if (!owner || !portfolio_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const cacheKey = `portfolio-${owner}-${portfolio_name}`;
			const cachedData = await getObject(cacheKey);

			if (cachedData?.cov) {
				console.log("using cached data");
				return res.json({ stock_covariances: cachedData.cov });
			}

			const investments = await portfolioDatabase.getInvestments(
				owner,
				portfolio_name,
			);
			const stocks = investments.map((investment) => investment.stock_symbol);
			const stockCovariances = await portfolioDatabase.stockCovariance(stocks);

			await setObject(cacheKey, { ...cachedData, cov: stockCovariances });

			res.json({ stock_covariances: stockCovariances });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving stock correlations" });
		}
	},
);

portfolioRouter.post(
	"/stock-covariance-date-range",
	async (req: AuthedRequest, res: Response) => {
		try {
			const { owner, portfolioName, startDate, endDate } = req.body;
			if (!owner || !portfolioName) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const investments = await portfolioDatabase.getInvestments(
				owner,
				portfolioName,
			);
			const stocks = investments.map((investment) => investment.stock_symbol);
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

portfolioRouter.post(
	"/stock-cov",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		const { stock_symbol } = req.body;
		try {
			const cacheKey = `stock-${stock_symbol}`;
			const cachedData = await getObject(cacheKey);

			if (cachedData?.cov) {
				console.log("using cached data");
				return res.json({ stock_cov: cachedData.cov });
			}

			const stockCov = await portfolioDatabase.stockCoefficient(stock_symbol);

			await setObject(cacheKey, { beta: cachedData?.beta, cov: stockCov });

			if (!stock_symbol) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			res.json({ stock_cov: stockCov });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving stock cov" });
		}
	},
);

portfolioRouter.post(
	"/stock-cov-date-range",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		const { stockSymbol, startDate, endDate } = req.body;
		try {
			const stockCov = await portfolioDatabase.stockCoefficientRange(
				stockSymbol,
				startDate,
				endDate,
			);

			if (!stockSymbol) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			res.json({ stock_cov: stockCov });
		} catch (error) {
			console.log(error);
			res.status(500).json({ error: "Error retrieving stock cov" });
		}
	},
);

portfolioRouter.get(
	"/:owner/:portfolioName/portfolio-total",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		const { owner, portfolioName } = req.params;
		try {
			if (!owner || !portfolioName) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const cacheKey = `portfolio-${owner}-${portfolioName}`;
			const cachedData = await getObject(cacheKey);

			if (cachedData?.total_value) {
				console.log("using cached data");
				return res.json({ total_value: cachedData.total_value });
			}

			const portfolioTotal = await portfolioDatabase.portfolioTotalValue(
				owner,
				portfolioName,
			);

			await setObject(cacheKey, { total_value: portfolioTotal, ...cachedData });

			res.json({ portfolio_total: portfolioTotal });
		} catch (error) {
			return res.status(500).json({ error: "Error retrieving total" });
		}
	},
);

portfolioRouter.post(
	"/portfolio-cash-transfer",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		const owner = req.user?.username;
		const { from_portfolio_name, to_portfolio_name, amount } = req.body;

		if (
			!owner ||
			!from_portfolio_name ||
			!to_portfolio_name ||
			amount == null
		) {
			return res.status(400).json({ error: "Missing required parameters" });
		}

		if (from_portfolio_name === to_portfolio_name) {
			return res
				.status(400)
				.json({ error: "Cannot transfer to same portfolio" });
		}

		try {
			await portfolioDatabase.interPortfolioCashTransfer(
				owner,
				from_portfolio_name,
				to_portfolio_name,
				amount,
			);
			return res.json({ message: "Cash transferred successfully" });
		} catch (error) {
			return res.status(500).json({ error: "Error transferring cash" });
		}
	},
);
