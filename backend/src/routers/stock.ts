import { Router } from "express";
import { stockDatabase } from "../database/StocksDatabase";
import { PolynomialRegression} from 'ml-regression-polynomial';
import type { StocksDaily, StocksTable } from "../types/db-schema";
import "dotenv/config";

export const stockRouter = Router();

const mean = (stockList: any[]) => {
    const sum = stockList.reduce((a: any, b: any) => a + b, 0);
    return sum / stockList.length;
};

const std = (stockList: any[]) => {
    const meanValue = mean(stockList);
    const variance = stockList.reduce((sum: number, value: number) => sum + (value - meanValue) ** 2, 0) / (stockList.length - 1);
    return Math.sqrt(variance);
};

const rollingMeanAndStd = (stockList: string | any[], windowSize: number) => {
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

const meanReversion = (stockList: any[]) => {
    const windowSize = 15;
    const closePrices = stockList.map((d: { close_price: any; }) => d.close_price);
    const { means, stds } = rollingMeanAndStd(closePrices, windowSize);

    const result = stockList.slice(windowSize - 1).map((d: { close_price: number; }, i: string | number) => {
        const zScore = (d.close_price - means[i]) / stds[i];
        return {
            ...d,
            Moving_Average_15: means[i],
            Z_Score: zScore,
            Buy_Signal: zScore < -1,
            Sell_Signal: zScore > 1,
        };
    });

    return result;
};

const polyRegression = (closePrices: any[], daysInFuture: number) => {
    const deg = 7;
    const x = closePrices.map((_, index) => index);
    const regression = new PolynomialRegression(x, closePrices, deg);

    const predictedPrices = [];
    for (let i = 0; i < daysInFuture; i++) {
        const futureIndex = closePrices.length + i;
        const predictedPrice = regression.predict(futureIndex);
        predictedPrices.push(predictedPrice);
    }

    return predictedPrices;
};

const processStockList = (stockList: StocksDaily[], predictAmount: number) => {
    // Convert stock_date to ISO string
    for (const stock of stockList) {
        stock.stock_date = new Date(stock.stock_date).toISOString().substring(0, 10);
    }

    // Calculate the mean reversion and polynomial regression
    const processedData = meanReversion(stockList);

    const closePrices = stockList.map((d) => d.close_price);
    const daysAhead = predictAmount;
    const predictedPrices = polyRegression(closePrices, daysAhead);

    return { processedData, predictedPrices };
};

// Endpoint to get stock prediction by ticker and on long into future time period you want to predict
// Excludes todays date in the return data
// Start date will always be the todays date
stockRouter.post("/prediction/:ticker", async (req, res) => {
    try {
        // map dates to predicted 
        const { ticker } = req.params;
        const { endDate } = req.body;
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        // Sanity checks
        const end = new Date(endDate);
        if (Number.isNaN(end.getTime())) {
            return res.status(400).json({ error: "Invalid end date format. Use yyyy-mm-dd" });
        }

        const predictAmount = Math.ceil((end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const stockList = await stockDatabase.getAllStocks(ticker);

        if (!stockList) {
            return res.status(404).json({ error: "Stock not found" });
        }

        const closePrices = stockList.map((stock) => stock.close_price);
        const predictedPrices = polyRegression(closePrices, predictAmount);
        const monthData = stockList.slice(stockList.length - 100, stockList.length).map((stock) => ({date: stock.stock_date, price: stock.close_price}));

        const predictedData = [...monthData];
        for (let i = 0; i < predictAmount; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i + 1);
            predictedData.push({ date: date.toISOString().split('T')[0], price: predictedPrices[i] });
        }

        return res.json({ predictedData });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// Endpoint to get historic stock data by ticker and time period
// End date is always going to be todays date
stockRouter.post("/:ticker", async (req, res) => {
    try {
        const { ticker } = req.params;
        const { startDate } = req.body;
        const endDate = new Date().toISOString().substring(0, 10);

        const stockList = await stockDatabase.getStockByTimePeriod(ticker, new Date(startDate), new Date(endDate));

        if (!stockList) {
            return res.status(404).json({ error: "Stock not found" });
        }

        return res.json({ stockList });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

stockRouter.get("/stock-companies", async (req, res) => {
    try {
        const companyList = await stockDatabase.getAllStocksCompany();

        if (!companyList) {
            return res.status(404).json({ error: "Company not found" });
        }

        return res.json({ companyList });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

stockRouter.get("/stock-company/:ticker", async (req, res) => {
    try {
        const { ticker } = req.params;
        let company: StocksTable[] = [];
        if (ticker === "*") {
            company = await stockDatabase.getAllStocksCompany();
        } else {
            company = await stockDatabase.getSimilarStockCompany(ticker);
        }

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        return res.json({ company });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});