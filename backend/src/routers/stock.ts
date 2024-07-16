import { Router } from "express";
import { stockDatabase } from "../database/StocksDatabase";
import { exec } from "node:child_process";
import { type AuthedRequest, verifyToken } from "../middleware/auth";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import "dotenv/config";
import type { StocksDaily } from "../types/db-schema";

export const stockRouter = Router();

const processStockList = (ticker: string, startDate: Date, endDate: Date, stockList: StocksDaily) => {
    return new Promise((resolve, reject) => {
        const rawData = JSON.stringify(stockList);
        const scriptCommand = `python3 src/utils/scripts/sp-mr.py ${ticker} ${startDate} ${endDate} ${rawData}`;

        exec(scriptCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return reject(error);
            }

            const processedStockList = JSON.spare(stdout);
            return resolve(processedStockList);
        });
    });
};

stockRouter.post("/prediction", async(req, res) => {
    try {
        const { ticker, startDate, endDate } = req.body;

        const stockList = await stockDatabase.getStockByTimePeriod(ticker, startDate, endDate);
        const processedStockList = await processStockList(ticker, startDate, endDate, stockList);

        console.log(processedStockList)

        return res.json({ processedStockList });
    } catch (error) {
        return res.status(500).json({ error: "Error getting stock data" });
    }
});