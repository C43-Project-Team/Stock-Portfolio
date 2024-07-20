import { Injectable } from '@angular/core';
import type { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { HistoricStock } from './historicStock.interface';
import type { PredictedStock } from './predictedStock.interface';
import environment from '@environment';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private baseUrl = environment.api_url;

  constructor(private http: HttpClient) {}

  getHistoricData(ticker: string, startDate: string): Observable<HistoricStock[]> {
    return this.http.post<HistoricStock[]>(`${this.baseUrl}/${ticker}`, { startDate });
  }

  getPredictions(ticker: string, endDate: string): Observable<PredictedStock[]> {
    return this.http.post<PredictedStock[]>(`${this.baseUrl}/prediction/${ticker}`, { endDate });
  }
}
