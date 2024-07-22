import { db } from "./db-controller";
import fs from "fs";
import { createReadStream } from "fs";
import csv from "csv-parser";
import path from "path";

async function insertDataStock(data) {
	try {
		await db.insertInto("stocks").values(data).execute();
		console.log("Data inserted successfully");
	} catch (error) {
		console.error("Error inserting data:", error);
	}
}

async function importStockCompanyCsv(filePath) {
	const results = [];

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

async function insertStocksDailyData(data) {
	try {
		await db.insertInto("stocks_daily").values(data).execute();
		console.log("Data inserted successfully");
	} catch (error) {
		console.error("Error inserting data:", error);
	}
}

// Read and parse the CSV file, then insert data into the database
async function importStocksDailyCsv(filePath) {
	const results = [];
	const chunkSize = 5000;
	let chunkCount = 0;

	const stream = createReadStream(filePath)
		.pipe(csv())
		.on("data", (data) => {
			const transformedData = {
				stock_symbol: data.Code,
				stock_date: new Date(data.Timestamp).toISOString().split("T")[0],
				open_price: parseFloat(data.Open),
				close_price: parseFloat(data.Close),
				low: parseFloat(data.Low),
				high: parseFloat(data.High),
				volume: parseInt(data.Volume, 10),
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
	const exportStockDailyFile = path.resolve(
		"src",
		"utils",
		"data",
		"SP500History-db.csv",
	);
	const exportStockFile = path.resolve(
		"src",
		"utils",
		"data",
		"stock-companies.csv",
	);
    const exportStockRecentFile = path.resolve(
		"src",
		"utils",
		"data",
		"stock_data_recent.csv",
	);
    const exportUptoDateStockFile = path.resolve(
		"src",
		"utils",
		"data",
		"stock_data_3.csv",
	);

	// Import the data from the CSV files to the database
	await importStockCompanyCsv(exportStockFile);
	await importStocksDailyCsv(exportStockDailyFile);
	await importStocksDailyCsv(exportStockRecentFile);
    await importStocksDailyCsv(exportUptoDateStockFile);
}

ingestData().then(() => {
	console.log("Data imported successfully");
});
