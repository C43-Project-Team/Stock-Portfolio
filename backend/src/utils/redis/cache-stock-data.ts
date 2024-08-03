import { db } from "../db/db-controller";
import { sql } from "kysely";
import {
	setObject,
	getObject,
	printStoreContents,
	clearCache,
} from "../redis/controller";

const cacheStockData = async () => {
	const betaQuery = sql`SELECT public.calculate_all_stock_betas()`;
	const betaRes = await betaQuery.execute(db);

	const covQuery = sql`SELECT public.all_cov()`;
	const covRes = await covQuery.execute(db);

	const betaRows = betaRes.rows;
	const covRows = covRes.rows;

	const betaMap = new Map<string, number>();
	for (const row of betaRows) {
		// Extract ticker and beta value from the tuple string
		// @ts-ignore
		const [ticker, beta] = row.calculate_all_stock_betas
			.replace("(", "")
			.replace(")", "")
			.split(",");

		betaMap.set(ticker, Number.parseFloat(beta));
	}

	for (const row of covRows) {
		// @ts-ignore
		const [ticker, cov] = row.all_cov
			.replace("(", "")
			.replace(")", "")
			.split(",");

		if (betaMap.has(ticker)) {
			const key = `stock-${ticker}`;
			const value = {
				beta: betaMap.get(ticker),
				cov: Number.parseFloat(cov),
			};
			// Store in Redis
			await setObject(key, value);
		}
	}

	console.log("All stock data (beta and cov) have been cached.");
};

cacheStockData().then(() => {
	process.exit(0);
});
