import {
	Component,
	Input,
	OnInit,
	OnChanges,
	SimpleChanges,
} from "@angular/core";
import { ApiService } from "@services/api.service";
import { CommonModule } from "@angular/common";
import {
	StockCorrelation,
	StockCorrelationsResponse,
    StockCovariance,
    StockCovarianceResponse
} from "./stock-correlation-covariance.interface";

@Component({
	selector: "app-stock-matrix",
	standalone: true,
	imports: [CommonModule],
	templateUrl: "./stock-matrix.component.html",
	styles: "",
})
export class StockMatrixComponent implements OnInit, OnChanges {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	@Input() data: any;
	@Input() matrixType: 'correlation' | 'covariance' = 'correlation';
	stockNames: string[] = [];
	matrix: number[][] = [];

	constructor(private apiService: ApiService) {}

	ngOnInit(): void {
		this.updateMatrixDisplay();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes["data"]) {
			this.updateMatrixDisplay();
		}
	}

	private updateMatrixDisplay(): void {
		if (!this.data || this.data.length === 0) {
			return;
		}

		this.stockNames = Array.from(
			new Set(
				this.data.flatMap((cor: { stock1: string; stock2: string }) => [
					cor.stock1,
					cor.stock2,
				]),
			),
		);
		this.buildMatrixDisplay();
	}

	private buildMatrixDisplay(): void {
		const size = this.stockNames.length;
		this.matrix = Array.from({ length: size }, () =>
			Array(size).fill(0),
		);

		// biome-ignore lint/complexity/noForEach: <explanation>
		this.data.forEach(
			(item: {
				stock1: string;
				stock2: string;
				correlation?: number;
				covariance?: number;
			}) => {
				const i = this.stockNames.indexOf(item.stock1);
				const j = this.stockNames.indexOf(item.stock2);
				if (i !== -1 && j !== -1) {
					this.matrix[i][j] = this.matrixType === 'correlation' ? item.correlation ?? 0 : item.covariance ?? 0;
				}
			},
		);
	}

	getCellColor(value: number): string {
		if (this.matrixType === 'correlation') {
			if (value >= 0.7) {
				return "bg-green-500 text-white";
			// biome-ignore lint/style/noUselessElse: <explanation>
			} else if (value >= 0.4) {
				return "bg-yellow-500 text-black";
			// biome-ignore lint/style/noUselessElse: <explanation>
			} else {
				return "bg-red-500 text-white";
			}
		// biome-ignore lint/style/noUselessElse: <explanation>
		} else {
			return "bg-blue-500 text-white";
		}
	}
}
