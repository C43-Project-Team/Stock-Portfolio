import { db } from "../utils/db/db-controller"; // Adjust the import path accordingly
import type { Database, StocksDaily, StocksTable } from "../types/db-schema";
import type { Kysely } from "kysely";

class StocksDatabase {
	private db: Kysely<Database>;

	constructor() {
		this.db = db;
	}

    async getStockByTimePeriod(ticker: string, startDate: Date, endDate: Date): Promise<StocksDaily[] | null> {
        const stockList = await this.db
            .selectFrom("stocks_daily")
            .selectAll()
            .where("stock_symbol", "=", ticker)
            .where((eb) => eb.between("stock_date", startDate, endDate))
            .execute();

        return stockList.length > 0 ? stockList : null;
    }

    async getAllStocks(ticker: string): Promise<StocksDaily[] | null> {
        const stockList = await this.db
            .selectFrom("stocks_daily")
            .selectAll()
            .where("stock_symbol", "=", ticker)
            .execute();

        return stockList.length > 0 ? stockList : null;
    }

    async getSimilarStockCompany(ticker: string): Promise<StocksTable[] | null> {
        const company = await this.db
            .selectFrom("stocks")
            .selectAll()
            .where("stock_symbol", "like", `%${ticker}%`)
            .orderBy("stock_symbol", "asc")
            .execute();

        return company.length > 0 ? company : null;
    }

    async getAllStocksCompany(): Promise<StocksTable[] | null> {
        const company = await this.db
            .selectFrom("stocks")
            .selectAll()
            .execute();

        return company.length > 0 ? company : null;
    }
    
    // async insertStock()
}

export const stockDatabase = new StocksDatabase();
