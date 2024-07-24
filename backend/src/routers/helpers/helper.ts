export const mean = (stockList: any[]) => {
	const sum = stockList.reduce((a: any, b: any) => a + b, 0);
	return sum / stockList.length;
};

export const std = (stockList: any[]) => {
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