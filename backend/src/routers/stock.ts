import { Router } from "express";
import { stockDatabase } from "../database/StocksDatabase";
import { exec } from "node:child_process";
import { type AuthedRequest, verifyToken } from "../middleware/auth";
import "dotenv/config";
import type { StocksDaily } from "../types/db-schema";
import path, { dirname, join } from "node:path";
import { mean, std } from "mathjs";
import { fileURLToPath } from "node:url";
import { parseISO } from "date-fns";

export const stockRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const processStockList = (ticker: string, startDate: Date, endDate: Date, stockList: Array<StocksDaily>) => {
    return new Promise((resolve, reject) => {
        const rawData = JSON.stringify(stockList)
        const scriptPath = path.join(__dirname, "..", "utils", "scripts", "sp-mr.py");
        const scriptEnvPath = path.join(__dirname, "..", "..", ".backend", "Scripts", "activate");
        const scriptCommand = `${scriptEnvPath} && python ${scriptPath} ${ticker} ${startDate} ${endDate} '${rawData}'`;


        // exec(scriptCommand, (error, stdout, stderr) => {
        //     if (error) {
        //         console.error(`exec error: ${error}`);
        //         return reject(error);
        //     }

        //     if (stderr) {
        //         console.error(`script stderr: ${stderr}`);
        //         return reject(stderr);
        //     }

        //     try {
        //         const processedStockList = JSON.parse(stdout);
        //         return resolve(processedStockList);
        //     } catch (parseError) {
        //         return reject(parseError);
        //     }
        // });

        const childProcess = exec(scriptCommand);

        let stdout = "";
        let stderr = "";

        // Capture stdout
        childProcess.stdout.on("data", (data) => {
            stdout += data.toString();
            console.log(`stdout: ${data}`);
        });

        // Capture stderr
        childProcess.stderr.on("data", (data) => {
            stderr += data.toString();
            console.error(`stderr: ${data}`);
        });

        // Handle process completion
        childProcess.on("close", (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                return reject(new Error(`Python script exited with code ${code}`));
            }

            try {
                const processedStockList = JSON.parse(stdout);
                return resolve(processedStockList);
            } catch (parseError) {
                console.error(`Error parsing JSON: ${parseError}`);
                return reject(parseError);
            }
        });
    });
};

stockRouter.post("/prediction", async (req, res) => {
    try {
        const { ticker, startDate, endDate } = req.body;

        const stockList = await stockDatabase.getStockByTimePeriod(ticker, new Date(startDate), new Date(endDate));
        const processedStockList = processStockList(ticker, startDate, endDate, stockList);

        return res.json({ processedStockList });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
