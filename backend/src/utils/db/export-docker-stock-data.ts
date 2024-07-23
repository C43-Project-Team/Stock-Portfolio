import Docker from "dockerode";
import * as path from "path";
import tar from "tar-fs";

const docker = new Docker();
const postgresContainerName =
	process.env.POSTGRES_CONTAINER_NAME || "postgres_stockms";
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

async function StockImportScript() {
	try {
		// Receive the container id
		const container = docker.getContainer(postgresContainerName);

		// Start the export process by creating a directory in the container and copying files
		await createDirectoryInContainer(container, "/tmp/DailyStockData");
		await copyFileToContainer(
			container,
			exportStockDailyFile,
			"/tmp/DailyStockData/SP500History-db.csv",
		);
		await copyFileToContainer(
			container,
			exportStockFile,
			"/tmp/DailyStockData/stock-companies.csv",
		);

		// Import the data from the CSV files to the database
		await importCsvFileToDb(
			"/tmp/DailyStockData/stock-companies.csv",
			"stocks",
		);
		await importCsvFileToDb(
			"/tmp/DailyStockData/SP500History-db.csv",
			"stocks_daily",
		);

		console.log("Data imported successfully");
	} catch (error) {
		console.error("Error: ", error);
	}
}

async function createDirectoryInContainer(
	container: Docker.Container,
	directory: string,
) {
	const exec = await container.exec({
		Cmd: ["mkdir", "-p", directory],
		AttachStdout: true,
		AttachStderr: true,
	});

	const stream = await exec.start();
	return new Promise<void>((resolve, reject) => {
		stream.on("data", (data) => {
			console.log(data.toString());
		});
		stream.on("end", () => {
			resolve();
		});
		stream.on("error", (err) => {
			reject(err);
		});
	});
}

async function copyFileToContainer(
	container: Docker.Container,
	source: string,
	destination: string,
) {
	return new Promise<void>((resolve, reject) => {
		const pack = tar.pack(path.dirname(source), {
			entries: [path.basename(source)],
		});

		container.putArchive(pack, { path: path.dirname(destination) }, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

async function importCsvFileToDb(filePath: string, tableName: string) {
	try {
		const container = docker.getContainer(postgresContainerName);
		const exec = await container.exec({
			Cmd: [
				"psql",
				"-U",
				"stockms",
				"-c",
				`\\COPY ${tableName} FROM '${filePath}' WITH CSV HEADER`,
			],
			AttachStdout: true,
			AttachStderr: true,
		});

		const stream = await exec.start();

		stream.on("data", (data) => {
			console.log(data.toString());
		});

		stream.on("end", () => {
			console.log("CSV file imported into the database");
		});
	} catch (error) {
		console.error("Error: ", error);
	}
}

StockImportScript();
