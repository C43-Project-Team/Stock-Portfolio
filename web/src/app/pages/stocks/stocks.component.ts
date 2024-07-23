import { Component, OnInit } from "@angular/core";
import type { HistoricStockInterface } from "./historicStock.interface";
import type { PredictedStockInterface } from "./predictedStock.interface";
import { StockService } from "@services/stocks.service";
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
	],
	templateUrl: "./stocks.component.html",
	styles: [],
})
export class StocksComponent implements OnInit {
	historicStockData: HistoricStockInterface[] = [];
	predictedStockData: PredictedStockInterface[] = [];
	ticker: string = "";
	startDate: Date = new Date("2023-07-30");
	endDate: Date = new Date("2024-12-08");
	//   aggregationPeriod: 'day' | 'week' | 'month' = 'day';
	aggregationPeriod: string = "day";
	aggregationOptions: any[] = [
		{ label: "Day", value: "day" },
		{ label: "Week", value: "week" },
		{ label: "Month", value: "month" },
	];

	presetTime: string = "1Y";
	presetTimeOptions: any[] = [
		{ label: "1W", value: "1W" },
		{ label: "1M", value: "1M" },
		{ label: "1Q", value: "1Q" },
		{ label: "1Y", value: "1Y" },
		{ label: "3Y", value: "3Y" },
		{ label: "5Y", value: "5Y" },
		{ label: "Max", value: "Max" },
	];

	historicChartData: ChartData<"line"> = { datasets: [] };
	predictionChartData: ChartData<"line"> = { datasets: [] };

	constructor(
		private stockService: StockService,
		private route: ActivatedRoute,
	) {}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			this.ticker = params["ticker"];
			this.fetchHistoricStockData();
			this.fetchPredictedStockData();
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

	transformData(data: any): any {
		if (data && Array.isArray(data) && data.length > 0) {
			const innerData = data[0];
			if (Array.isArray(innerData) && innerData.length > 0) {
				return innerData;
			}
		}
	}

	groupDataByTimePeriod(data: any[], timePeriod: "week" | "month"): any[] {
		const groupedData: any = {};

		for (const item of data) {
			const date = new Date(item.stock_date);
			let groupKey: string = "";

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
			const averageClosePrice =
				group.reduce((sum: any, item: any) => sum + item.close_price, 0) /
				group.length;
			return {
				stock_date: key,
				close_price: averageClosePrice,
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
			labels: groupedData.map((data: any) => data.stock_date),
			datasets: [
				{
					label: "Price",
					data: this.historicStockData.map((data) => data.close_price),
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
					borderColor: "rgba(75, 192, 192, 1)",
					borderWidth: 1,
				},
			],
		};
	}

	onStartDateChange(event: any): void {
		this.startDate = event;
		this.fetchHistoricStockData();
	}

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
