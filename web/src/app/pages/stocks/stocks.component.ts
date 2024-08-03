import { Component, OnInit } from "@angular/core";
import type { HistoricStockInterface } from "./historicStock.interface";
import type { PredictedStockInterface } from "./predictedStock.interface";
import { StockService } from "@services/stocks.service";
import { CommonModule } from "@angular/common";
import { ChartData } from "chart.js";
import { ChartModule } from "primeng/chart";
import { LayoutComponent } from "../layout/layout.component";
import { StockChartComponent } from "../../components/stock-chart/stock-chart.component";
import { ActivatedRoute } from "@angular/router";
import { CalendarModule } from "primeng/calendar";
import { FormsModule } from "@angular/forms";
import { FloatLabelModule } from "primeng/floatlabel";
import { DropdownModule } from "primeng/dropdown";
import { SelectButtonModule } from "primeng/selectbutton";
import { StockCompany } from "./stockCompany.interface";
import { ApiService } from "@services/api.service";
import { ProgressSpinnerModule } from "primeng/progressspinner";

@Component({
	selector: "app-stocks",
	standalone: true,
	imports: [
		ChartModule,
		LayoutComponent,
		StockChartComponent,
		CalendarModule,
		FormsModule,
		FloatLabelModule,
		DropdownModule,
		SelectButtonModule,
		CommonModule,
		ProgressSpinnerModule,
	],
	templateUrl: "./stocks.component.html",
	styles: [],
})
export class StocksComponent implements OnInit {
	historicStockData: HistoricStockInterface[] = [];
	predictedStockData: PredictedStockInterface[] = [];
	ticker = "";
	startDate: Date = new Date("2023-07-30");
	endDate: Date = new Date("2024-12-08");
	stockCompany: StockCompany = {
		stock_symbol: "",
		company: "",
		description: "",
	};
	aggregationPeriod = "day";
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	aggregationOptions: any[] = [
		{ label: "Day", value: "day" },
		{ label: "Week", value: "week" },
		{ label: "Month", value: "month" },
	];

	presetTime = "1Y";
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	presetTimeOptions: any[] = [
		{ label: "1W", value: "1W" },
		{ label: "1M", value: "1M" },
		{ label: "1Q", value: "1Q" },
		{ label: "1Y", value: "1Y" },
		{ label: "3Y", value: "3Y" },
		{ label: "5Y", value: "5Y" },
		{ label: "Max", value: "Max" },
	];

	selectedDataType = "close_price";
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	dataTypeOptions: any[] = [
		{ label: "Close Price", value: "close_price" },
		{ label: "Stock Volume", value: "volume" },
		{ label: "Open Price", value: "open_price" },
		{ label: "Daily Low", value: "low" },
		{ label: "Daily High", value: "high" },
	];

	historicChartData: ChartData<"line"> = { datasets: [] };
	predictionChartData: ChartData<"line"> = { datasets: [] };

	loading = false;

	beta = 0;
	cov = 0;

	constructor(
		private stockService: StockService,
		private route: ActivatedRoute,
		private apiService: ApiService,
	) {}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			// biome-ignore lint/complexity/useLiteralKeys: <explanation>
			this.ticker = params["ticker"];
			this.loading = true;
			this.fetchStockCompany();
			this.fetchStats().then(() => {
				this.loading = false;
			});
			this.fetchHistoricStockData();
			this.fetchPredictedStockData();
		});
	}

	async fetchStats() {
		const covResponse = await this.apiService.getPortfolioStockCOV(this.ticker);
		const betaResponse = await this.apiService.getPortfolioStocksBeta(
			this.ticker,
		);

		this.cov = Number.parseFloat(covResponse.stock_cov.toFixed(3));
		this.beta = Number.parseFloat(betaResponse.stock_beta.toFixed(3));
	}

	fetchStockCompany(): void {
		this.stockService
			.getStockCompany(this.ticker)
			.subscribe((data: StockCompany) => {
				this.stockCompany = Object.values(data)[0];
			});
	}

	fetchHistoricStockData(): void {
		const historyStart = this.startDate.toISOString().split("T")[0];
		this.stockService
			.getHistoricData(this.ticker, historyStart)
			.subscribe((data) => {
				this.historicStockData = this.transformData(Object.values(data));
				console.log(this.historicStockData);
				this.updateHistoricChart();
			});
	}

	fetchPredictedStockData(): void {
		const predictEnd = this.endDate.toISOString().split("T")[0];
		this.stockService
			.getPredictions(this.ticker, predictEnd)
			.subscribe((data) => {
				this.predictedStockData = this.transformData(Object.values(data));
				console.log(this.predictedStockData);
				this.updatePredictedChart();
			});
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	transformData(data: any): any {
		if (data && Array.isArray(data) && data.length > 0) {
			const innerData = data[0];
			if (Array.isArray(innerData) && innerData.length > 0) {
				return innerData;
			}
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	groupDataByTimePeriod(data: any[], timePeriod: "week" | "month"): any[] {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const groupedData: any = {};

		for (const item of data) {
			const date = new Date(item.stock_date);
			let groupKey = "";

			if (timePeriod === "week") {
				const startOfWeek = new Date(
					date.setDate(date.getDate() - date.getDay()),
				);
				groupKey = startOfWeek.toISOString().split("T")[0];
			} else if (timePeriod === "month") {
				groupKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
			}

			if (!groupedData[groupKey]) {
				groupedData[groupKey] = [];
			}

			groupedData[groupKey].push(item);
		}

		const result = Object.keys(groupedData).map((key) => {
			const group = groupedData[key];
			const averageValue =
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				group.reduce(
					(sum: any, item: any) => sum + item[this.selectedDataType],
					0,
				) / group.length;
			return {
				stock_date: key,
				[this.selectedDataType]: averageValue,
			};
		});

		return result;
	}

	updateHistoricChart(): void {
		const groupedData =
			this.aggregationPeriod === "day"
				? this.historicStockData
				: this.groupDataByTimePeriod(
						this.historicStockData,
						this.aggregationPeriod as "week" | "month",
					);
		this.historicChartData = {
			// labels: this.historicStockData.map(data => data.stock_date),
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			labels: groupedData.map((data: any) => data.stock_date),
			datasets: [
				{
					// label: "Price",
					label: this.selectedDataType.replace(/_/g, " ").toUpperCase(),
					// data: this.historicStockData.map((data) => data.close_price),
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					data: groupedData.map((data: any) => data[this.selectedDataType]),
					fill: false,
					borderColor: "rgba(75, 192, 192, 1)",
					borderWidth: 1,
				},
			],
		};
	}

	updatePredictedChart(): void {
		this.predictionChartData = {
			labels: this.predictedStockData.map((data) => data.date),
			datasets: [
				{
					label: "Predicted Price",
					data: this.predictedStockData.map((data) => data.price),
					fill: false,
					borderColor: "rgba(38, 194, 129, 1)",
					borderWidth: 1,
				},
			],
		};
	}

	// updatePredictedChart(): void {
	//     const today = new Date().toISOString().split("T")[0];
	//     const todayDate = new Date(today);

	//     const labelsSet = new Set(this.predictedStockData.map(data => data.date));
	//     const labels = Array.from(labelsSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

	//     const dataMap = new Map(this.predictedStockData.map(data => [data.date, data.price]));
	//     const historicData = labels.map(date => new Date(date) <= todayDate ? dataMap.get(date) || null : null);
	//     const predictedData = labels.map(date => new Date(date) > todayDate ? dataMap.get(date) || null : null);

	//     this.predictionChartData = {
	//         labels: labels,
	//         datasets: [
	//             {
	//                 label: "Predicted Price",
	//                 data: historicData,
	//                 fill: false,
	//                 borderColor: "rgba(75, 192, 192, 1)",
	//                 borderWidth: 1,
	//             },
	//             {
	//                 label: "Predicted Price",
	//                 data: predictedData,
	//                 fill: false,
	//                 borderColor: "rgba(153, 102, 255, 1)",
	//                 borderWidth: 1,
	//             }
	//         ],
	//     };
	// }

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	onStartDateChange(event: any): void {
		this.startDate = event;
		this.fetchHistoricStockData();
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	onEndDateChange(event: any): void {
		this.endDate = event;
		this.fetchPredictedStockData();
	}

	setPresetTime(preset: string): void {
		this.presetTime = preset;
		const currentDate = new Date();
		switch (preset) {
			case "1W":
				this.startDate = new Date(
					currentDate.setDate(currentDate.getDate() - 7),
				);
				break;
			case "1M":
				this.startDate = new Date(
					currentDate.setMonth(currentDate.getMonth() - 1),
				);
				break;
			case "1Q":
				this.startDate = new Date(
					currentDate.setMonth(currentDate.getMonth() - 3),
				);
				break;
			case "1Y":
				this.startDate = new Date(
					currentDate.setFullYear(currentDate.getFullYear() - 1),
				);
				break;
			case "3Y":
				this.startDate = new Date(
					currentDate.setFullYear(currentDate.getFullYear() - 3),
				);
				break;
			case "5Y":
				this.startDate = new Date(
					currentDate.setFullYear(currentDate.getFullYear() - 5),
				);
				break;
			case "Max":
				this.startDate = new Date("2013-02-08");
				break;
		}
		this.fetchHistoricStockData();
	}
}
