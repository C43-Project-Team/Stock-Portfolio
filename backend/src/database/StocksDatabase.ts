import { db } from "../utils/db/db-controller"; // Adjust the import path accordingly
import type { Database, StocksDaily } from "../types/db-schema";
import type { Kysely } from "kysely";

class StocksDatabase {
	private db: Kysely<Database>;

	constructor() {
		this.db = db;
	}

    async getStockByTimePeriod(ticker: string, startDate: Date, endDate: Date): Promise<StocksDaily | null> {
        const stockList = await this.db
            .selectFrom("stocks_daily")
            .selectAll()
            .where("stock_symbol", "=", ticker)
            .where((eb) => eb.between("date", startDate, endDate))
            .execute();
        
            return stockList || null;
    }

    // async insertStock()
}

export const stockDatabase = new StocksDatabase();
