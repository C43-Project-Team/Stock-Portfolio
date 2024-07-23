import { db } from "@utils/db/db-controller";
import type { Database, Portfolio } from "../types/db-schema";
import type { Kysely } from "kysely";

class PortfolioDatabase {
	private db: Kysely<Database>;

	constructor() {
		this.db = db;
	}

	async getUserPortfolios(owner: string): Promise<Portfolio[]> {
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

	async deletePortfolio(owner: string, portfolio_name: string): Promise<void> {
		await this.db
			.deleteFrom("portfolios")
			.where("owner", "=", owner)
			.where("portfolio_name", "=", portfolio_name)
			.execute();
	}
}

export const portfolioDatabase = new PortfolioDatabase();
