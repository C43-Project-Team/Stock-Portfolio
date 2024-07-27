import { rollingMeanAndStd } from "./helper";
import { PolynomialRegression } from "ml-regression-polynomial";

export const meanReversion = (stockList: any[]) => {
	const windowSize: number = 15;
	const closePrices = stockList.map((d: { close_price: any }) => d.close_price);
	const { means, stds } = rollingMeanAndStd(closePrices, windowSize);

	const result = stockList
		.slice(windowSize - 1)
		.map((d: { close_price: number }, i: string | number) => {
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

export const polyRegression = (closePrices: any[], daysInFuture: number) => {
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
