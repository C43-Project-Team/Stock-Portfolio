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
		const stockList = await this.db
			.selectFrom("stocks_daily")
			.selectAll()
			.where("stock_symbol", "=", ticker)
            .orderBy("stock_date", "asc")
			.execute();

		return stockList.length > 0 ? stockList : null;
	}

	async getSimilarStockCompany(ticker: string): Promise<StocksTable[] | null> {
		const company = await this.db
			.selectFrom("stocks")
			.selectAll()
			.where("stock_symbol", "like", `${ticker}%`)
			.orderBy("stock_symbol", "asc")
			.execute();

		return company.length > 0 ? company : null;
	}

	async getStockCompany(ticker: string): Promise<StocksTable | null> {
		const company = await this.db
			.selectFrom("stocks")
			.selectAll()
			.where("stock_symbol", "=", ticker)
			.execute() as StocksTable[];
		
		return company.length > 0 ? company[0] : null;
	}

	async getAllStocksCompany(): Promise<StocksTable[] | null> {
		const company = await this.db
            .selectFrom("stocks")
            .selectAll()
            .orderBy("stock_symbol", "asc")
            .execute();

		return company.length > 0 ? company : null;
	}

	async getRecentStockPrice(stock_symbol: string): Promise<{ close_price: number } | null> {
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
