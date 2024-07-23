import { db } from "@utils/db/db-controller";
import type { Database, StocksList, PrivateAccess } from "../types/db-schema";
import type { Kysely } from "kysely";

class StockListDatabase {
	private db: Kysely<Database>;

	constructor() {
		this.db = db;
	}

	async getUserStockLists(owner: string): Promise<StocksList[]> {
		return await this.db
			.selectFrom("stocks_list")
			.selectAll()
			.where("owner", "=", owner)
			.execute();
	}

	async createStockList(
		owner: string,
		stock_list_name: string,
		isPrivate: boolean,
	): Promise<StocksList> {
		const [stockList] = await this.db
			.insertInto("stocks_list")
			.values({
				owner,
				stock_list_name,
				private: isPrivate,
			})
			.returning(["owner", "stock_list_name", "private"])
			.execute();

		return stockList;
	}

	async getPrivateStockListsSharedWithUser(
		user: string,
	): Promise<StocksList[]> {
		return await this.db
			.selectFrom("private_access")
			.innerJoin("stocks_list", (join) =>
				join
					.onRef("private_access.stock_list_owner", "=", "stocks_list.owner")
					.onRef(
						"private_access.stock_list_name",
						"=",
						"stocks_list.stock_list_name",
					),
			)
			.selectAll("stocks_list")
			.where("private_access.user", "=", user)
			.execute();
	}

	async getPublicStockLists(): Promise<StocksList[]> {
		return await this.db
			.selectFrom("stocks_list")
			.selectAll()
			.where("private", "=", false)
			.execute();
	}
}

export const stockListDatabase = new StockListDatabase();
