import { db } from "@utils/db/db-controller";
import type { Contains, Database, StocksList } from "../types/db-schema";
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
			.select(({ fn }) => fn.count("owner").as("count"))
			.where("private", "=", false)
			.executeTakeFirst();
		return result ? Number(result.count) : 0;
	}

	async toggleStockListVisibility(
		owner: string,
		stock_list_name: string,
	): Promise<StocksList | undefined> {
		const existingStockList = await this.db
			.selectFrom("stocks_list")
			.selectAll()
			.where("owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.executeTakeFirst();

		if (!existingStockList) {
			throw new Error(
				`Stock list with the name "${stock_list_name}" does not exist.`,
			);
		}

		const updatedStockList = await this.db
			.updateTable("stocks_list")
			.set({ private: !existingStockList.private })
			.where("owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.returning(["owner", "stock_list_name", "private"])
			.executeTakeFirst();

		return updatedStockList;
	}

	async getStocksInList(
		owner: string,
		stock_list_name: string,
	): Promise<Contains[]> {
		return await this.db
			.selectFrom("contains")
			.selectAll()
			.where("stock_list_owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.execute();
	}

	async addStockToList(
		owner: string,
		stock_list_name: string,
		stock_symbol: string,
		num_shares: number,
	): Promise<void> {
		await this.db
			.insertInto("contains")
			.values({
				stock_list_owner: owner,
				stock_list_name: stock_list_name,
				stock_symbol: stock_symbol,
				num_shares: num_shares,
			})
			.onConflict((oc) =>
				oc
					.columns(["stock_list_owner", "stock_list_name", "stock_symbol"])
					.doUpdateSet({
						num_shares: (eb) => eb("contains.num_shares", "+", num_shares),
					}),
			)
			.execute();
	}

	async removeSharesFromStockList(
		owner: string,
		stock_list_name: string,
		stock_symbol: string,
		num_shares: number,
	): Promise<void> {
		const investment = await this.db
			.selectFrom("contains")
			.select("num_shares")
			.where("stock_list_owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.where("stock_symbol", "=", stock_symbol)
			.executeTakeFirst();

		if (!investment || investment.num_shares < num_shares) {
			throw new Error("Insufficient shares");
		}

		await this.db
			.updateTable("contains")
			.set((eb) => ({
				num_shares: eb("contains.num_shares", "-", num_shares),
			}))
			.where("stock_list_owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.where("stock_symbol", "=", stock_symbol)
			.execute();

		const updatedInvestment = await this.db
			.selectFrom("contains")
			.select("num_shares")
			.where("stock_list_owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.where("stock_symbol", "=", stock_symbol)
			.executeTakeFirst();

		if (updatedInvestment && updatedInvestment.num_shares === 0) {
			await this.db
				.deleteFrom("contains")
				.where("stock_list_owner", "=", owner)
				.where("stock_list_name", "=", stock_list_name)
				.where("stock_symbol", "=", stock_symbol)
				.execute();
		}
	}

	async deleteStockFromList(
		owner: string,
		stock_list_name: string,
		stock_symbol: string,
	): Promise<void> {
		await this.db
			.deleteFrom("contains")
			.where("stock_list_owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.where("stock_symbol", "=", stock_symbol)
			.execute();
	}
}

export const stockListDatabase = new StockListDatabase();
