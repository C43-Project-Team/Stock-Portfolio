import { db } from "../utils/db/db-controller"; // Adjust the import path accordingly
import type { Database, StocksDaily, StocksTable } from "../types/db-schema";
import type { Kysely } from "kysely";

class StocksDatabase {
	private db: Kysely<Database>;

	constructor() {
		this.db = db;
	}

	async getStockByTimePeriod(
		ticker: string,
		startDate: Date,
		endDate: Date,
	): Promise<StocksDaily[] | null> {
		/**
		 * select * from stocks_daily
		 * where stock_symbol = ticker and stock_date between startDate and endDate
		 * order by stock_date asc;
		 */
		const stockList = await this.db
			.selectFrom("stocks_daily")
			.selectAll()
			.where("stock_symbol", "=", ticker)
			.where((eb) => eb.between("stock_date", startDate, endDate))
			.orderBy("stock_date", "asc")
			.execute();

		return stockList.length > 0 ? stockList : null;
	}

	async getAllStocks(ticker: string): Promise<StocksDaily[] | null> {
		/**
		 * select * from stocks_daily
		 * where stock_symbol = ticker
		 * order by stock_date asc;
		 */
		const stockList = await this.db
			.selectFrom("stocks_daily")
			.selectAll()
			.where("stock_symbol", "=", ticker)
			.orderBy("stock_date", "asc")
			.execute();

		return stockList.length > 0 ? stockList : null;
	}

	/**
	 * select * from stocks_daily
	 * where stock_symbol like 'ticker%'
	 * order by stock_symbol asc;
	 */
	async getSimilarStockCompany(ticker: string): Promise<StocksTable[] | null> {
		const company = await this.db
			.selectFrom("stocks")
			.selectAll()
			.where("stock_symbol", "like", `${ticker}%`)
			.orderBy("stock_symbol", "asc")
			.execute();

		return company.length > 0 ? company : null;
	}

	/**
	 * select * from stocks
	 * where stock_symbol = ticker;
	 */
	async getStockCompany(ticker: string): Promise<StocksTable | null> {
		const company = (await this.db
			.selectFrom("stocks")
			.selectAll()
			.where("stock_symbol", "=", ticker)
			.execute()) as StocksTable[];

		return company.length > 0 ? company[0] : null;
	}

	/**
	 * select * from stocks
	 * order by stock_symbol asc;
	 */
	async getAllStocksCompany(): Promise<StocksTable[] | null> {
		const company = await this.db
			.selectFrom("stocks")
			.selectAll()
			.orderBy("stock_symbol", "asc")
			.execute();

		return company.length > 0 ? company : null;
	}

	async getRecentStockPrice(
		stock_symbol: string,
	): Promise<{ close_price: number } | null> {
		/**
		 * select close_price from stocks_daily
		 * where stock_symbol = stock_symbol
		 * order by stock_date desc
		 * limit 1;
		 */
		const recentPrice = await this.db
			.selectFrom("stocks_daily")
			.select("close_price")
			.where("stock_symbol", "=", stock_symbol)
			.orderBy("stock_date", "desc")
			.limit(1)
			.executeTakeFirst();

		return recentPrice || null;
	}
}

export const stockDatabase = new StocksDatabase();
