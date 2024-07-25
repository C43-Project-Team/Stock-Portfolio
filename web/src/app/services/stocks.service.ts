import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { HistoricStockInterface } from "../pages/stocks/historicStock.interface";
import { PredictedStockInterface } from "../pages/stocks/predictedStock.interface";
import { StockCompany } from "@pages/stocks/stockCompany.interface";
import environment from "@environment";

@Injectable({
	providedIn: "root",
})
export class StockService {
	private baseUrl: string = environment.api_url;

	constructor(private http: HttpClient) {}

	getHistoricData(
		ticker: string,
		startDate: string,
	): Observable<HistoricStockInterface[]> {
		// console.log(this.baseUrl + "/stock/" + ticker);
		return this.http.post<HistoricStockInterface[]>(
			`${this.baseUrl}/stock/${ticker}`,
			{ startDate },
		);
	}

	getPredictions(
		ticker: string,
		endDate: string,
	): Observable<PredictedStockInterface[]> {
		// console.log(this.baseUrl + "/stock/prediction/" + ticker);
		return this.http.post<PredictedStockInterface[]>(
			`${this.baseUrl}/stock/prediction/${ticker}`,
			{ endDate },
		);
	}

	getStockCompanies(searchTicker: string): Observable<StockCompany[]> {
		return this.http.get<StockCompany[]>(`${this.baseUrl}/stock/similar/stock-company/${searchTicker.toUpperCase()}`,);
	}

	getStockCompany(ticker: string): Observable<StockCompany> {
		return this.http.get<StockCompany>(`${this.baseUrl}/stock/stock-company/${ticker.toUpperCase()}`,);
	}
}
