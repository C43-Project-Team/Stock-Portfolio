import { db } from "@utils/db/db-controller";
import type { Database, Portfolio, Investments } from "../types/db-schema";
import type { Kysely } from "kysely";

class PortfolioDatabase {
	private db: Kysely<Database>;

	constructor() {
		this.db = db;
	}

	async getUserPortfolios(owner: string): Promise<Portfolio[]> {
		return await this.db
			.selectFrom("portfolios")
			.selectAll()
			.where("owner", "=", owner)
			.execute();
	}

	async createPortfolio(
		owner: string,
		portfolio_name: string,
		initialDeposit: number,
	): Promise<Portfolio> {
		// Check if a portfolio with the same name already exists
		const existingPortfolio = await this.db
			.selectFrom("portfolios")
			.selectAll()
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.executeTakeFirst();

		if (existingPortfolio) {
			throw new Error(
				`Portfolio with the name "${portfolio_name}" already exists.`,
			);
		}

		const [portfolio] = await this.db
			.insertInto("portfolios")
			.values({
				owner,
				portfolio_name,
				cash: initialDeposit,
			})
			.returning(["owner", "portfolio_name", "cash", "portfolio_created_at"])
			.execute();

		return portfolio;
	}

	async deletePortfolio(owner: string, portfolio_name: string): Promise<void> {
		await this.db
			.deleteFrom("portfolios")
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.execute();
	}

	async getPortfolioFromName(
		owner: string,
		portfolio_name: string,
	): Promise<Portfolio | null | undefined> {
		return await this.db
			.selectFrom("portfolios")
			.selectAll()
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.executeTakeFirst();
	}

	async getInvestments(
		owner: string,
		portfolio_name: string,
	): Promise<Investments[]> {
		return await this.db
			.selectFrom("investments")
			.selectAll()
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.execute();
	}

	async buyShares(
		owner: string,
		portfolio_name: string,
		stock_symbol: string,
		num_shares: number,
	): Promise<void> {
		// Fetch the most recent close price for the stock symbol
		const recentPrice = await this.db
			.selectFrom("stocks_daily")
			.select("close_price")
			.where("stock_symbol", "=", stock_symbol)
			.orderBy("stock_date", "desc")
			.limit(1)
			.executeTakeFirst();

		if (!recentPrice) {
			throw new Error(`Stock not found: ${stock_symbol}`);
		}

		const price_per_share = recentPrice.close_price;
		const totalCost = num_shares * price_per_share;

		// Check if the portfolio has enough cash
		const portfolio = await this.db
			.selectFrom("portfolios")
			.select("cash")
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.executeTakeFirst();

		if (!portfolio || portfolio.cash < totalCost) {
			throw new Error("Insufficient funds");
		}

		// Update the portfolio's cash
		await this.db
			.updateTable("portfolios")
			.set((eb) => ({
				cash: eb("cash", "-", totalCost),
			}))
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.execute();

		// Update the investments table
		await this.db
			.insertInto("investments")
			.values({
				owner,
				portfolio_name,
				stock_symbol,
				num_shares,
			})
			.onConflict((oc) =>
				oc.columns(["owner", "portfolio_name", "stock_symbol"]).doUpdateSet({
					num_shares: (eb) => eb("investments.num_shares", "+", num_shares),
				}),
			)
			.execute();
	}

	async sellShares(
		owner: string,
		portfolio_name: string,
		stock_symbol: string,
		num_shares: number,
	): Promise<void> {
		// Check if the portfolio has enough shares
		const investment = await this.db
			.selectFrom("investments")
			.select("num_shares")
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.where("stock_symbol", "=", stock_symbol)
			.executeTakeFirst();

		if (!investment || investment.num_shares < num_shares) {
			throw new Error("Insufficient shares");
		}

		// Fetch the most recent close price for the stock symbol
		const recentPrice = await this.db
			.selectFrom("stocks_daily")
			.select("close_price")
			.where("stock_symbol", "=", stock_symbol)
			.orderBy("stock_date", "desc")
			.limit(1)
			.executeTakeFirst();

		if (!recentPrice) {
			throw new Error(
				`No recent price found for stock symbol: ${stock_symbol}`,
			);
		}

		const price_per_share = recentPrice.close_price;
		const totalProceeds = num_shares * price_per_share;

		// Update the portfolio's cash
		await this.db
			.updateTable("portfolios")
			.set((eb) => ({
				cash: eb("cash", "+", totalProceeds),
			}))
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.execute();

		// Update the investments table
		await this.db
			.updateTable("investments")
			.set((eb) => ({
				num_shares: eb("investments.num_shares", "-", num_shares),
			}))
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.where("stock_symbol", "=", stock_symbol)
			.execute();

		// Check if the number of shares is now zero and delete the entry if it is
		const updatedInvestment = await this.db
			.selectFrom("investments")
			.select("num_shares")
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.where("stock_symbol", "=", stock_symbol)
			.executeTakeFirst();

		if (updatedInvestment && updatedInvestment.num_shares === 0) {
			await this.db
				.deleteFrom("investments")
				.where("owner", "=", owner)
				.where("portfolio_name", "=", portfolio_name)
				.where("stock_symbol", "=", stock_symbol)
				.execute();
		}
	}

	async depositCash(
		owner: string,
		portfolio_name: string,
		amount: number,
	): Promise<void> {
		await this.db
			.updateTable("portfolios")
			.set((eb) => ({
				cash: eb("cash", "+", amount),
			}))
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.execute();
	}

	// TODO: Transfer money between portfolios
}

export const portfolioDatabase = new PortfolioDatabase();
