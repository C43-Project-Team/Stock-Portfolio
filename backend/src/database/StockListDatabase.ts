import { db } from "@utils/db/db-controller";
import type {
	Contains,
	Database,
	PrivateAccess,
	Review,
	StocksList,
	User,
} from "../types/db-schema";
import { sql, type Kysely } from "kysely";

class StockListDatabase {
	private db: Kysely<Database>;

	constructor() {
		this.db = db;
	}

	async getUserStockLists(owner: string): Promise<StocksList[]> {
		/**
		 * select * from stocks_list
		 * where owner = owner;
		 */
		return await this.db
			.selectFrom("stocks_list")
			.selectAll()
			.where("owner", "=", owner)
			.execute();
	}

	async getStockList(
		owner: string,
		stock_list_name: string,
	): Promise<StocksList | null | undefined> {
		/**
		 * select * from stocks_list
		 * where owner = owner and stock_list_name = stock_list_name
		 * limit 1;
		 */
		return await this.db
			.selectFrom("stocks_list")
			.selectAll()
			.where("owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.executeTakeFirst();
	}

	async createStockList(
		owner: string,
		stock_list_name: string,
		isPrivate: boolean,
	): Promise<StocksList> {
		/**
		 * select * from stocks_list
		 * where owner = owner and stock_list_name = stock_list_name
		 * limit 1;
		 */
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

		/**
		 * insert into stocks_list (owner, stock_list_name, private)
		 * values (owner, stock_list_name, isPrivate)
		 * returning owner, stock_list_name, private;
		 */
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

	/**
	 * delete from stocks_list
	 * where owner = owner and stock_list_name = stock_list_name;
	 */
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
		/**
		 * select * from private_access
		 * inner join stocks_list
		 * on private_access.stock_list_owner = stocks_list.owner and private_access.stock_list_name = stocks_list.stock_list_name
		 * where private_access.user = authenticatedUser and private_access.stock_list_owner = stockListOwner;
		 */
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

	/**
	 * select * from stocks_list
	 * where owner = username and private = false;
	 */
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
		/**
		 * select * from stocks_list
		 * where private = false
		 * limit limit
		 * offset offset;
		 */
		return await this.db
			.selectFrom("stocks_list")
			.selectAll()
			.where("private", "=", false)
			.limit(limit)
			.offset(offset)
			.execute();
	}

	/**
	 * select count(owner) as count from stocks_list
	 * where private = false;
	 * limit 1;
	 */
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
		/**
		 * select * from stocks_list
		 * where owner = owner and stock_list_name = stock_list_name
		 * limit 1;
		 */
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

		/**
		 * update stocks_list
		 * set private = !existingStockList.private
		 * where owner = owner and stock_list_name = stock_list_name
		 * returning owner, stock_list_name, private
		 * limit 1;
		 */
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
		/**
		 * select * from contains
		 * where stock_list_owner = owner and stock_list_name = stock_list_name;
		 */
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
		/**
		 * insert into contains (stock_list_owner, stock_list_name, stock_symbol, num_shares)
		 * values (owner, stock_list_name, stock_symbol, num_shares)
		 * on conflict (stock_list_owner, stock_list_name, stock_symbol)
		 * do update set num_shares = num_shares + num_shares;
		 */
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
		/**
		 * select num_shares from contains
		 * where stock_list_owner = owner and stock_list_name = stock_list_name and stock_symbol = stock_symbol
		 * limit 1;
		 */
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

		/**
		 * update contains
		 * set num_shares = contains.num_shares - num_shares
		 * where stock_list_owner = owner and stock_list_name = stock_list_name and stock_symbol = stock_symbol;
		 */
		await this.db
			.updateTable("contains")
			.set((eb) => ({
				num_shares: eb("contains.num_shares", "-", num_shares),
			}))
			.where("stock_list_owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.where("stock_symbol", "=", stock_symbol)
			.execute();

		/**
		 * select num_shares from contains
		 * where stock_list_owner = owner and stock_list_name = stock_list_name and stock_symbol = stock_symbol
		 */
		const updatedInvestment = await this.db
			.selectFrom("contains")
			.select("num_shares")
			.where("stock_list_owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.where("stock_symbol", "=", stock_symbol)
			.executeTakeFirst();

		if (updatedInvestment && updatedInvestment.num_shares === 0) {
			/**
			 * delete from contains
			 * where stock_list_owner = owner and stock_list_name = stock_list_name and stock_symbol = stock_symbol;
			 */
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
		/**
		 * delete from contains
		 * where stock_list_owner = owner and stock_list_name = stock_list_name and stock_symbol = stock_symbol;
		 */
		await this.db
			.deleteFrom("contains")
			.where("stock_list_owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.where("stock_symbol", "=", stock_symbol)
			.execute();
	}

	async getSharedUsers(
		owner: string,
		stock_list_name: string,
	): Promise<PrivateAccess[]> {
		/**
		 * select * from stocks_list
		 * where owner = owner and stock_list_name = stock_list_name
		 * limit 1;
		 */
		const stockList = await this.db
			.selectFrom("stocks_list")
			.selectAll()
			.where("owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.executeTakeFirst();

		if (!stockList) {
			throw new Error("Stock list not found");
		}

		if (!stockList.private) {
			throw new Error("Cannot list shared users for a public stock list");
		}

		/**
		 * select * from private_access
		 * where stock_list_owner = owner and stock_list_name = stock_list_name;
		 */
		return await this.db
			.selectFrom("private_access")
			.selectAll()
			.where("stock_list_owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.execute();
	}

	async searchUnsharedFriends(
		owner: string,
		stockListName: string,
		query: string,
	): Promise<User[]> {
		/**
		 * select user from private_access
		 * where stock_list_owner = owner and stock_list_name = stock_list_name;
		 */
		const sharedUsers = this.db
			.selectFrom("private_access")
			.select("user")
			.where("stock_list_owner", "=", owner)
			.where("stock_list_name", "=", stockListName);

		/**
		 * select receiving_friend as username from friends
		 * where requesting_friend = owner and pending = false
		 * union
		 * select requesting_friend as username from friends
		 * where receiving_friend = owner and pending = false;
		 */
		const friends = this.db
			.selectFrom("friends")
			.select("receiving_friend as username")
			.where("requesting_friend", "=", owner)
			.where("pending", "=", false)
			.union(
				this.db
					.selectFrom("friends")
					.select("requesting_friend as username")
					.where("receiving_friend", "=", owner)
					.where("pending", "=", false),
			);

		/**
		 * select * from users
		 * where username like 'query%' and username not in sharedUsers and username in friends and username <> owner;
		 */
		return await this.db
			.selectFrom("users")
			.selectAll()
			.where("username", "like", `${query}%`)
			.where((eb) => eb("username", "not in", sharedUsers))
			.where((eb) => eb("username", "in", friends))
			.where("username", "<>", owner)
			.execute();
	}

	async shareStockList(
		owner: string,
		stock_list_name: string,
		user: string,
	): Promise<void> {
		/**
		 * select * from stocks_list
		 * where owner = owner and stock_list_name = stock_list_name
		 * limit 1;
		 */
		const stockList = await this.db
			.selectFrom("stocks_list")
			.selectAll()
			.where("owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.executeTakeFirst();

		if (!stockList) {
			throw new Error("Stock list not found");
		}

		if (!stockList.private) {
			throw new Error("Cannot share a public stock list");
		}

		/**
		 * insert into private_access (user, stock_list_owner, stock_list_name)
		 * values (user, owner, stock_list_name);
		 */
		await this.db
			.insertInto("private_access")
			.values({
				user,
				stock_list_owner: owner,
				stock_list_name,
			})
			.execute();
	}

	async isFriend(owner: string, user: string): Promise<boolean> {
		/**
		 * select * from friends
		 * where (requesting_friend = owner and receiving_friend = user and pending = false) or (requesting_friend = user and receiving_friend = owner and pending = false)
		 * limit 1;
		 */
		const friend = await this.db
			.selectFrom("friends")
			.selectAll()
			.where((eb) =>
				eb.or([
					eb.and([
						eb("requesting_friend", "=", owner),
						eb("receiving_friend", "=", user),
						eb("pending", "=", false),
					]),
					eb.and([
						eb("requesting_friend", "=", user),
						eb("receiving_friend", "=", owner),
						eb("pending", "=", false),
					]),
				]),
			)
			.executeTakeFirst();

		return !!friend;
	}

	async revokeSharing(
		owner: string,
		stock_list_name: string,
		user: string,
	): Promise<void> {
		/**
		 * delete from private_access
		 * where stock_list_owner = owner and stock_list_name = stock_list_name and user = user;
		 */
		await this.db
			.deleteFrom("private_access")
			.where("stock_list_owner", "=", owner)
			.where("stock_list_name", "=", stock_list_name)
			.where("user", "=", user)
			.execute();
	}

	async hasAccess(
		user: string,
		stock_list_owner: string,
		stock_list_name: string,
	): Promise<boolean> {
		const stockList = await this.getStockList(
			stock_list_owner,
			stock_list_name,
		);

		if (user === stock_list_owner) {
			return true;
		}

		if (!stockList) {
			throw new Error("Stock list not found");
		}

		if (!stockList.private) {
			return true;
		}

		/**
		 * select * from private_access
		 * where user = user and stock_list_owner = stock_list_owner and stock_list_name = stock_list_name
		 * limit 1;
		 */
		const access = await this.db
			.selectFrom("private_access")
			.selectAll()
			.where("user", "=", user)
			.where("stock_list_owner", "=", stock_list_owner)
			.where("stock_list_name", "=", stock_list_name)
			.executeTakeFirst();

		return !!access;
	}

	async getAllPrivateStockListsSharedWithUser(
		authenticatedUser: string,
	): Promise<StocksList[]> {
		/**
		 * select stocks_list.* from private_access
		 * inner join stocks_list
		 * on private_access.stock_list_owner = stocks_list.owner and private_access.stock_list_name = stocks_list.stock_list_name
		 * where private_access.user = authenticatedUser;
		 */
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
			.where("private_access.user", "=", authenticatedUser)
			.execute();
	}

	async createReview(
		reviewer: string,
		stock_list_owner: string,
		stock_list_name: string,
		content: string,
		rating: number,
	): Promise<void> {
		// Check if the user has access to the stock list
		const hasAccess = await this.hasAccess(
			reviewer,
			stock_list_owner,
			stock_list_name,
		);
		if (!hasAccess) {
			throw new Error("Access denied");
		}

		/**
		 * insert into reviews (reviewer, stock_list_owner, stock_list_name, content, rating)
		 * values (reviewer, stock_list_owner, stock_list_name, content, rating);
		 */
		await this.db
			.insertInto("reviews")
			.values({
				reviewer,
				stock_list_owner,
				stock_list_name,
				content,
				rating,
			})
			.execute();
	}

	async updateReview(
		reviewer: string,
		stock_list_owner: string,
		stock_list_name: string,
		content: string,
		rating: number,
	): Promise<void> {
		// Check if the user has access to the stock list
		const hasAccess = await this.hasAccess(
			reviewer,
			stock_list_owner,
			stock_list_name,
		);
		if (!hasAccess) {
			throw new Error("Access denied");
		}

		/**
		 * update reviews
		 * set content = content, rating = rating, review_last_updated = now()
		 * where reviewer = reviewer and stock_list_owner = stock_list_owner and stock_list_name = stock_list_name;
		 */
		await this.db
			.updateTable("reviews")
			.set({
				content,
				rating,
				// @ts-ignore
				review_last_updated: new Date(),
			})
			.where("reviewer", "=", reviewer)
			.where("stock_list_owner", "=", stock_list_owner)
			.where("stock_list_name", "=", stock_list_name)
			.execute();
	}

	async getReviews(
		stock_list_owner: string,
		stock_list_name: string,
	): Promise<Review[]> {
		/**
		 * select * from reviews
		 * where stock_list_owner = stock_list_owner and stock_list_name = stock_list_name
		 * order by review_creation_time desc;
		 */
		return await this.db
			.selectFrom("reviews")
			.selectAll()
			.where("stock_list_owner", "=", stock_list_owner)
			.where("stock_list_name", "=", stock_list_name)
			.orderBy("review_creation_time", "desc")
			.execute();
	}

	async deleteReview(
		reviewer: string,
		stock_list_owner: string,
		stock_list_name: string,
	): Promise<void> {
		// Ensure that the review belongs to the authenticated user
		console.log("Reviewer: ", reviewer);
		console.log("Stock list owner: ", stock_list_owner);
		console.log("Stock list name: ", stock_list_name);
		const review = await this.getReview(
			reviewer,
			stock_list_owner,
			stock_list_name,
		);

		if (!review) {
			throw new Error("Review not found");
		}

		/**
		 * delete from reviews
		 * where reviewer = reviewer and stock_list_owner = stock_list_owner and stock_list_name = stock_list_name;
		 */
		await this.db
			.deleteFrom("reviews")
			.where("reviewer", "=", reviewer)
			.where("stock_list_owner", "=", stock_list_owner)
			.where("stock_list_name", "=", stock_list_name)
			.execute();
	}

    async stockListBeta(owner: string, stockList_name: string): Promise<number> {
		const query = sql`SELECT public.calculate_stocklist_beta(${owner}, ${stockList_name})`;
		const res = await query.execute(db);
		return (res.rows[0] as { calculate_stocklist_beta: number })
			.calculate_stocklist_beta;
	}

	async stockListBetaRange(
		owner: string,
		stockList_name: string,
		startDate: string,
		endDate: string,
	): Promise<number> {
		const query = sql`SELECT public.calculate_stocklist_beta(${owner}, ${stockList_name}, ${startDate}, ${endDate})`;
		const res = await query.execute(db);
		return (res.rows[0] as { calculate_stocklist_beta: number })
			.calculate_stocklist_beta;
	}

	async getReview(
		reviewer: string,
		stock_list_owner: string,
		stock_list_name: string,
	): Promise<Review | null | undefined> {
		/**
		 * select * from reviews
		 * where reviewer = reviewer and stock_list_owner = stock_list_owner and stock_list_name = stock_list_name
		 * limit 1;
		 */
		return await this.db
			.selectFrom("reviews")
			.selectAll()
			.where("reviewer", "=", reviewer)
			.where("stock_list_owner", "=", stock_list_owner)
			.where("stock_list_name", "=", stock_list_name)
			.executeTakeFirst();
	}
}

export const stockListDatabase = new StockListDatabase();
