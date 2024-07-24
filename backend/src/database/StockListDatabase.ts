import { db } from "@utils/db/db-controller";
import type { Database, StocksList } from "../types/db-schema";
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
		// Check if a stock list with the same name already exists
		const existingStockList = await this.db
			.selectFrom("stocks_list")
			.selectAll()
			.where("owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.executeTakeFirst();

		if (existingStockList) {
			throw new Error(
				`Stock list with the name "${stock_list_name}" already exists.`,
			);
		}

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

	async deleteStockList(owner: string, stock_list_name: string): Promise<void> {
		await this.db
			.deleteFrom("stocks_list")
			.where("owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.execute();
	}

	async getPrivateStockListsSharedWithUser(
		authenticatedUser: string,
		stockListOwner: string,
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
			.where((eb) =>
				eb.and([
					eb("private_access.user", "=", authenticatedUser),
					eb("private_access.stock_list_owner", "=", stockListOwner),
				]),
			)
			.execute();
	}

	async getUserPublicStockLists(username: string): Promise<StocksList[]> {
		return await this.db
			.selectFrom("stocks_list")
			.selectAll()
			.where("owner", "=", username)
			.where("private", "=", false)
			.execute();
	}

	async getPublicStockLists(
		limit: number,
		offset: number,
	): Promise<StocksList[]> {
		return await this.db
			.selectFrom("stocks_list")
			.selectAll()
			.where("private", "=", false)
			.limit(limit)
			.offset(offset)
			.execute();
	}

	async getPublicStockListCount(): Promise<number> {
		const result = await this.db
			.selectFrom("stocks_list")
			// @ts-ignore
			.select(({ fn }) => fn.count("*").as("count"))
			.where("private", "=", false)
			.executeTakeFirst();
		return result ? Number(result.count) : 0;
	}
}

export const stockListDatabase = new StockListDatabase();
