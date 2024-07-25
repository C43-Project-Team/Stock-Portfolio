export const mean = (stockList: any[]) => {
	const sum = stockList.reduce((a: any, b: any) => a + b, 0);
	return sum / stockList.length;
};

export const std = (stockList: any[]): number => {
	const meanValue = mean(stockList);
	const variance =
		stockList.reduce(
			(sum: number, value: number) => sum + (value - meanValue) ** 2,
			0,
		) /
		(stockList.length - 1);
	return Math.sqrt(variance);
};

export const rollingMeanAndStd = (stockList: string | any[], windowSize: number) => {
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

export const variance = (prices: number[]): number => {
    const meanPrice = mean(price);
    const sum = prices.map((price) => (price - meanPrice) ** 2).reduce((a: number, b: number) => a + b, 0);
    return sum / prices.length;
}

export const covariance = (prices1: number[], prices2: number[]): number => {
    const meanPrice1 = mean(prices1);
    const meanPrice2 = mean(prices2);
    const sum = prices1.map((price: number, i: number) => (price - meanPrice1) * (prices2[i] - meanPrice2)).reduce((a: number, b: number) => a + b, 0);
    return sum / prices1.length;
}

export const correlation = (prices1: number[], prices2: number[]): number => {
    const cov = covariance(prices1, prices2);
    const std1 = std(prices1);
    const std2 = std(prices2);
    return cov / (std1 * std2);
}

export const beta = (stockPrices: number[], marketPrices: number[]): number => {
    const cov = covariance(stockPrices, marketPrices);
    const marketVar = variance(marketPrices);
    return cov / marketVar;
}