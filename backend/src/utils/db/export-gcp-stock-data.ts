import { db } from "./db-controller";
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import fs from "fs";
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import { createReadStream } from "fs";
import csv from "csv-parser";
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import path from "path";
// biome-ignore lint/style/useImportType: <explanation>
import { Database } from "@/types/db-schema";
// biome-ignore lint/style/useImportType: <explanation>
import { InsertExpression } from "kysely/dist/cjs/parser/insert-values-parser";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function insertDataStock(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	data: any[] | InsertExpression<Database, "stocks">,
) {
	try {
		await db.insertInto("stocks").values(data).execute();
		console.log("Data inserted successfully");
	} catch (error) {
		console.error("Error inserting data:", error);
	}
}

async function importStockCompanyCsv(filePath: fs.PathLike) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const results: any[] = [];

	const stream = fs
		.createReadStream(filePath)
		.pipe(csv())
		.on("data", (data) => {
			// Transform the CSV data to match the database column names
			const transformedData = {
				stock_symbol: data.symbol, // Map 'symbol' from CSV to 'stock_symbol'
				company: data.stock_company,
			};
			results.push(transformedData);
			// console.log("DATA", data);
		})
		.on("end", async () => {
			console.log("stocks CSV file successfully processed");
			await insertDataStock(results);
		});

	await new Promise((resolve, reject) => {
		stream.on("end", resolve);
		stream.on("error", reject);
	});
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function insertStocksDailyData(
	data: any[] | InsertExpression<Database, "stocks_daily">,
) {
	try {
		await db.insertInto("stocks_daily").values(data).execute();
		console.log("Data inserted successfully");
	} catch (error) {
		console.error("Error inserting data:", error);
	}
}

// Read and parse the CSV file, then insert data into the database
async function importStocksDailyCsv(filePath: fs.PathLike) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const results: any[] = [];
	const chunkSize = 5000;
	let chunkCount = 0;

	const stream = createReadStream(filePath)
		.pipe(csv())
		.on("data", (data) => {
			const transformedData = {
				stock_symbol: data.Code,
				stock_date: new Date(data.Timestamp).toISOString().split("T")[0],
				open_price: Number.parseFloat(data.Open),
				close_price: Number.parseFloat(data.Close),
				low: Number.parseFloat(data.Low),
				high: Number.parseFloat(data.High),
				volume: Number.parseInt(data.Volume, 10),
				return: Number.parseFloat(data.Return),
			};
			results.push(transformedData);

			// Insert in chunks
			if (results.length === chunkSize) {
				stream.pause();
				insertStocksDailyData([...results])
					.then(() => {
						results.length = 0; // Clear the array by setting length to 0
						chunkCount++;
						console.log(`Chunk ${chunkCount} inserted successfully`);
						stream.resume();
					})
					.catch((error) => {
						console.error("Error inserting chunk:", error);
						stream.resume();
					});
			}
		})
		.on("end", async () => {
			// Insert any remaining data
			if (results.length > 0) {
				await insertStocksDailyData(results);
				chunkCount++;
				console.log(`Chunk ${chunkCount} inserted successfully`);
			}
			console.log("DAILY CSV file successfully processed");
		});

	await new Promise((resolve, reject) => {
		stream.on("end", resolve);
		stream.on("error", reject);
	});
}

// Run the import function with a relative path
async function ingestData() {
	const exportStockFile = path.resolve(
		"src",
		"utils",
		"data",
		"stock-companies.csv",
	);
	// const exportStockDailyFile = path.resolve(
	// 	"src",
	// 	"utils",
	// 	"data",
	// 	"SP500History-db.csv",
	// );
	// const exportStockRecentFile = path.resolve(
	// 	"src",
	// 	"utils",
	// 	"data",
	// 	"stock_data_recent.csv",
	// );
	// const exportUptoDateStockFile = path.resolve(
	// 	"src",
	// 	"utils",
	// 	"data",
	// 	"stock_data_3.csv",
	// );

	const exportStockDailyFile = path.resolve(
		"src",
		"utils",
		"data",
		"return",
		"SP500History-db.csv",
	);
	const exportStockRecentFile = path.resolve(
		"src",
		"utils",
		"data",
		"return",
		"stock_data_recent.csv",
	);
	const exportUptoDateStockFile = path.resolve(
		"src",
		"utils",
		"data",
		"return",
		"stock_data_3.csv",
	);
	const exportUptoDateStockFile1 = path.resolve(
		"src",
		"utils",
		"data",
		"return",
		"stock_data_4.csv",
	);

	// Import the data from the CSV files to the database
	await importStockCompanyCsv(exportStockFile);
	await importStocksDailyCsv(exportStockDailyFile);
	await importStocksDailyCsv(exportStockRecentFile);
	await importStocksDailyCsv(exportUptoDateStockFile);
	await importStocksDailyCsv(exportUptoDateStockFile1);
}

ingestData().then(() => {
	console.log("Data imported successfully");
});
