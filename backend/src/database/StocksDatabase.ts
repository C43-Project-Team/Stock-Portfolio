import { db } from "../utils/db/database"; // Adjust the import path accordingly
import type { Database, Stocks } from "../types/db-schema";
import type { Kysely } from "kysely";

class StocksDatabase {
	private db: Kysely<Database>;

	constructor() {
		this.db = db;
    }


}

export const userDatabase = new StocksDatabase();
