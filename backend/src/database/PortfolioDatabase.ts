import { db } from "@utils/db/db-controller";
import type { Database, Portfolio, Investments } from "../types/db-schema";
import { sql, type Kysely } from "kysely";

class PortfolioDatabase {
	private db: Kysely<Database>;

	constructor() {
		this.db = db;
	}

	async getUserPortfolios(owner: string): Promise<Portfolio[]> {

        /**
         * select * from portfolios
         * where owner = owner;
         */
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
        /**
         * select * from portfolios
         * where owner = owner and portfolio_name = portfolio_name
         * limit 1;
         */
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

        /**
         * insert into portfolios (owner, portfolio_name, cash)
         * values (owner, portfolio_name, initialDeposit)
         * returning owner, portfolio_name, cash, portfolio_created_at;
         */
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

    /**
     * delete from portfolios
     * where owner = owner and portfolio_name = portfolio_name;
     */
	async deletePortfolio(owner: string, portfolio_name: string): Promise<void> {
		await this.db
			.deleteFrom("portfolios")
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.execute();
	}

    /**
     * select * from portfolios
     * where owner = owner and portfolio_name = portfolio_name
     * limit 1;
     */
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

    /**
     * select * from investments
     * where owner = owner and portfolio_name = portfolio_name;
     */
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

    /**
     * select close_price from investments
     * from stocks_daily
     * where stock_symbol = stock_symbol
     * order by stock_date desc
     * limit 1;
     */
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

        /**
         * select cash from portfolios
         * where owner = owner and portfolio_name = portfolio_name
         * limit 1;
         */
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

        /**
         * update portfolios
         * set cash = cash - totalCost
         * where owner = owner and portfolio_name = portfolio_name;
         */
		// Update the portfolio's cash
		await this.db
			.updateTable("portfolios")
			.set((eb) => ({
				cash: eb("cash", "-", totalCost),
			}))
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.execute();

        /**
         * insert into investments (owner, portfolio_name, stock_symbol, num_shares)
         * values (owner, portfolio_name, stock_symbol, num_shares)
         * on conflict (owner, portfolio_name, stock_symbol)
         * do update set num_shares = num_shares + num_shares;
         */
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
        /**
         * select num_shares from investments
         * where owner = owner and portfolio_name = portfolio_name and stock_symbol = stock_symbol
         * limit 1;
         */
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

        /**
         * select close_price from stocks_daily
         * where stock_symbol = stock_symbol
         * order by stock_date desc
         * limit 1;
         */
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

        /**
         * update portfolios
         * set cash = cash + totalProceeds
         * where owner = owner and portfolio_name = portfolio_name;
         */
		// Update the portfolio's cash
		await this.db
			.updateTable("portfolios")
			.set((eb) => ({
				cash: eb("cash", "+", totalProceeds),
			}))
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.execute();

        /**
         * update investments
         * set num_shares = num_shares - num_shares
         * where owner = owner and portfolio_name = portfolio_name and stock_symbol = stock_symbol;
         */
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

        /**
         * select num_shares from investments
         * where owner = owner and portfolio_name = portfolio_name and stock_symbol = stock_symbol
         * limit 1;
         */
		// Check if the number of shares is now zero and delete the entry if it is
		const updatedInvestment = await this.db
			.selectFrom("investments")
			.select("num_shares")
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.where("stock_symbol", "=", stock_symbol)
			.executeTakeFirst();

        /**
         * delete from investments
         * where owner = owner and portfolio_name = portfolio_name and stock_symbol = stock_symbol;
         */
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
        /**
         * update portfolios
         * set cash = cash + amount
         * where owner = owner and portfolio_name = portfolio_name;
         */
		await this.db
			.updateTable("portfolios")
			.set((eb) => ({
				cash: eb("cash", "+", amount),
			}))
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.execute();
	}

	async portfolioBeta(owner: string, portfolio_name: string): Promise<number> {
		const query = sql`SELECT public.calculate_portfolio_beta(${owner}, ${portfolio_name})`;
		const res = await query.execute(db);
		return (res.rows[0] as { calculate_portfolio_beta: number })
			.calculate_portfolio_beta;
	}

	async stockBeta(stock_ticker: string): Promise<number> {
		const query = sql`SELECT public.calculate_stock_beta(${stock_ticker});`;
		const res = (await query.execute(db)) as unknown as {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			rows: any;
			calculate_stock_beta: number;
		};
		return (res.rows[0] as { calculate_stock_beta: number })
			.calculate_stock_beta;
	}

	async stockCorrelations(
		stock_symbols: string[],
	): Promise<{ stock1: string; stock2: string; correlation: number }[]> {
		const query = sql`SELECT * FROM public.correlation_matrix(${stock_symbols})`;
		const { rows } = (await query.execute(this.db)) as {
			rows: { stock1: string; stock2: string; correlation: number }[];
		};
		return rows;
	}

	async stockCovariance(
		stock_symbols: string[],
	): Promise<{ stock1: string; stock2: string; covariance: number }[]> {
		const query = sql`SELECT * FROM public.covariance_matrix(${stock_symbols})`;
		const { rows } = (await query.execute(this.db)) as {
			rows: { stock1: string; stock2: string; covariance: number }[];
		};
		return rows;
	}

	async stockCoffectientOfVariation(stock_symbol: string): Promise<number> {
		const query = sql`SELECT public.cov(${stock_symbol})`;
		const res = await query.execute(this.db);
		return (res.rows[0] as { cov: number }).cov;
	}

	// TODO: Transfer money between portfolios - DONE!!!!!!!!!!!
	async interPortfolioCashTransfer(
		owner: string,
		sending_portfolio: string,
		receiving_portfolio: string,
		amount: number,
	) {
        /**
         * update portfolios
         * set cash = cash - amount
         * where owner = owner and portfolio_name = sending_portfolio;
         */
		await this.db
			.updateTable("portfolios")
			.set((eb) => ({
				cash: eb("cash", "-", amount),
			}))
			.where("owner", "=", owner)
			.where("portfolio_name", "=", sending_portfolio)
			.execute();

        /**
         * update portfolios
         * set cash = cash + amount
         * where owner = owner and portfolio_name = receiving_portfolio;
         */
        // Update the receiving portfolio
		await this.db
			.updateTable("portfolios")
			.set((eb) => ({
				cash: eb("cash", "+", amount),
			}))
			.where("owner", "=", owner)
			.where("portfolio_name", "=", receiving_portfolio)
			.execute();
	}
}

export const portfolioDatabase = new PortfolioDatabase();
