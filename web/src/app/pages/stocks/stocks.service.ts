import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { HistoricStockInterface } from "./historicStock.interface";
import { PredictedStockInterface } from "./predictedStock.interface";
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
		return this.http.post<HistoricStockInterface[]>(`${this.baseUrl}/stock/${ticker}`, { startDate });
	}

	getPredictions(
		ticker: string,
		endDate: string,
	): Observable<PredictedStockInterface[]> {
        // console.log(this.baseUrl + "/stock/prediction/" + ticker);
		return this.http.post<PredictedStockInterface[]>(`${this.baseUrl}/stock/prediction/${ticker}`, { endDate });
	}
}
