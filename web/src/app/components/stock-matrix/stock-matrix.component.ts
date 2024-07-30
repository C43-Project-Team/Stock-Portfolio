// biome-ignore lint/style/useImportType: <explanation>
import {
	Component,
	Input,
	OnInit,
	OnChanges,
	SimpleChanges,
} from "@angular/core";
// biome-ignore lint/style/useImportType: <explanation>
import { ApiService } from "@services/api.service";
import { CommonModule } from "@angular/common";
// biome-ignore lint/style/useImportType: <explanation>
import {
	StockCorrelation,
	StockCorrelationsResponse,
} from "./stock-correlation.interface";

@Component({
	selector: "app-stock-matrix",
	standalone: true,
	imports: [CommonModule],
	templateUrl: "./stock-matrix.component.html",
	styles: "",
})
export class StockMatrixComponent implements OnInit, OnChanges {
	// @Input() owner_name = '';
	// @Input() portfolio_name = '';
	@Input() correlations: any;
	stockNames: string[] = [];
	correlationMatrix: number[][] = [];

	constructor(private apiService: ApiService) {}

	ngOnInit(): void {
		// this.fetchStockCorrelations();
		this.updateMatrixDisplay();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes["correlations"]) {
			this.updateMatrixDisplay();
		}
	}

	private updateMatrixDisplay(): void {
		if (!this.correlations || this.correlations.length === 0) {
			return;
		}

		this.stockNames = Array.from(
			new Set(
				this.correlations.flatMap((cor: { stock1: any; stock2: any }) => [
					cor.stock1,
					cor.stock2,
				]),
			),
		);
		this.buildMatrixDisplay();
	}

	// async fetchStockCorrelations() {
	//     try {
	//         // const res = await this.apiService.StockCorrelations(this.owner_name, this.portfolio_name);
	//         // const correlations = res.stock_correlations;
	//         this.stockNames = Array.from(new Set(this.correlations.flatMap((cor: { stock1: any; stock2: any; }) => [cor.stock1, cor.stock2])));
	//         this.buildMatrixDisplay(this.correlations);
	//     } catch (error) {
	//         console.error('Error fetching stock correlations:', error);
	//     }
	// }

	// buildMatrixDisplay(correlations: StockCorrelation[]): void {
	//     console.log('Building matrix with correlations:', correlations);
	//     const size = this.stockNames.length;
	//     this.correlationMatrix = Array.from({ length: size }, () => Array(size).fill(0));

	//     // biome-ignore lint/complexity/noForEach: <explanation>
	//         correlations.forEach(correlation => {
	//         const i = this.stockNames.indexOf(correlation.stock1);
	//         const j = this.stockNames.indexOf(correlation.stock2);
	//         if (i !== -1 && j !== -1) {  // Ensure indices are valid
	//             this.correlationMatrix[i][j] = correlation.correlation;
	//         }
	//     });
	//     console.log('Correlation Matrix:', this.correlationMatrix);
	// }

	private buildMatrixDisplay(): void {
		const size = this.stockNames.length;
		this.correlationMatrix = Array.from({ length: size }, () =>
			Array(size).fill(0),
		);

		// biome-ignore lint/complexity/noForEach: <explanation>
		this.correlations.forEach(
			(correlation: {
				stock1: string;
				stock2: string;
				correlation: number;
			}) => {
				const i = this.stockNames.indexOf(correlation.stock1);
				const j = this.stockNames.indexOf(correlation.stock2);
				if (i !== -1 && j !== -1) {
					this.correlationMatrix[i][j] = correlation.correlation;
				}
			},
		);
	}

	getCellColor(correlation: number): string {
		if (correlation >= 0.7) {
			return "bg-green-500 text-white";
			// biome-ignore lint/style/noUselessElse: <explanation>
		} else if (correlation >= 0.4) {
			return "bg-yellow-500 text-black";
			// biome-ignore lint/style/noUselessElse: <explanation>
		} else {
			return "bg-red-500 text-white";
		}
	}
}
