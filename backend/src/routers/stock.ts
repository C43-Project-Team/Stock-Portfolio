import { Router } from "express";
import { stockDatabase } from "../database/StocksDatabase";
import "dotenv/config";

export const stockRouter = Router();

const processStockList = (stockList) => {
    const mean = (stockList) => {
        const sum = stockList.reduce((a, b) => a + b, 0);
        return sum / stockList.length;
    };

    const std = (stockList) => {
        const meanValue = mean(stockList);
        const variance = stockList.reduce((sum, value) => sum + Math.pow(value - meanValue, 2), 0) / (stockList.length - 1);
        return Math.sqrt(variance);
    };

    const rollingMeanAndStd = (stockList, windowSize) => {
        const means = [];
        const stds = [];

        for (let i = 0; i <= stockList.length - windowSize; i++) {
            const windowData = stockList.slice(i, i + windowSize);
            const windowMean = mean(windowData);
            const windowStd = std(windowData);

            means.push(windowMean);
            stds.push(windowStd);
        }

        return { means, stds };
    };

    const meanReversion = (stockList) => {
        const windowSize = 15;
        const closePrices = stockList.map(d => d.close_price);
        const { means, stds } = rollingMeanAndStd(closePrices, windowSize);

        const result = stockList.slice(windowSize - 1).map((d, i) => {
            const zScore = (d.close_price - means[i]) / stds[i];
            return {
                ...d,
                Moving_Average_15: means[i],
                Z_Score: zScore,
                Buy_Signal: zScore < -1,
                Sell_Signal: zScore > 1
            };
        });

        return result;
    };

    for (const stock of stockList) {
        stock.stock_date = new Date(stock.stock_date).toISOString().substring(0, 10);
    }

    const processedData = meanReversion(stockList);
    return processedData;
};

stockRouter.post("/prediction", async (req, res) => {
    try {
        const { ticker, startDate, endDate } = req.body;
        const stockList = await stockDatabase.getStockByTimePeriod(ticker, new Date(startDate), new Date(endDate));

        if (!stockList) {
            return res.status(404).json({ error: "Stock not found" });
        }

        const processedStockList = processStockList(stockList);

        return res.json({ processedStockList });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
