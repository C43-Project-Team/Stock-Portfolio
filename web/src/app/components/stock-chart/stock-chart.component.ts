import { Component, Input } from "@angular/core";
import {
	ChartData,
	ChartOptions,
	Chart,
	registerables,
	PluginOptionsByType,
} from "chart.js";
import { ChartModule } from "primeng/chart";
import crosshair from "chartjs-plugin-crosshair";

Chart.register(...registerables, crosshair);

@Component({
	selector: "app-stock-chart",
	standalone: true,
	imports: [ChartModule],
	templateUrl: "./stock-chart.component.html",
	styles: "",
})
export class StockChartComponent {
	@Input() chartData: ChartData<"line"> = { datasets: [] };

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	chartOptions: ChartOptions<"line"> & { tooltips: any } = {
		responsive: true,
		scales: {
			x: {
				display: true,
				title: {
					display: true,
					text: "Date",
				},
			},
			y: {
				display: true,
				title: {
					display: true,
					text: "Price",
				},
			},
		},
		plugins: {
			crosshair: {
				line: {
					color: "#F66",
					width: 1,
				},
				sync: {
					enabled: false,
					group: 1,
					suppressTooltips: false,
				},
				zoom: {
					enabled: true, // enable zooming
					zoomboxBackgroundColor: "rgba(66,133,244,0.2)", // background color of zoom box
					zoomboxBorderColor: "#48F", // border color of zoom box
					zoomButtonText: "Reset Zoom", // reset zoom button text
					zoomButtonClass: "reset-zoom", // reset zoom button class
				},
				callbacks: {
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					beforeZoom: (start: any, end: any) => true,
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					afterZoom: (start: any, end: any) => {},
				},
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			} as any,
		} as unknown as PluginOptionsByType<"line">,
		interaction: {
			intersect: false,
			mode: "index",
		},
		tooltips: {
			intersect: false,
			mode: "nearest",
			callbacks: {
				label: (tooltipItem: any) => {
					return `Price: ${tooltipItem.formattedValue}`;
				},
			},
		},
	};
}
