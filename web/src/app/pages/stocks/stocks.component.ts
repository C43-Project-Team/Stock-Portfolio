import { Component, OnInit } from '@angular/core';
import type { HistoricStockInterface } from './historicStock.interface';
import type { PredictedStockInterface } from './predictedStock.interface';
import { StockService } from './stocks.service';
import { ChartData } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { LayoutComponent } from "../layout/layout.component";
import { StockChartComponent } from "../../components/stock-chart/stock-chart.component";

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [ChartModule, LayoutComponent, StockChartComponent],
  templateUrl: './stocks.component.html',
  styles: []
})

export class StocksComponent implements OnInit {
  historicStockData: HistoricStockInterface[] = [];
  predictedStockData: PredictedStockInterface[] = [];
  ticker: string = "MSFT";
  startDate: string = "2020-07-31";
  endDate: string = "2024-12-08";

  historicChartData: ChartData<'line'> = { datasets: [] };
  predictionChartData: ChartData<'line'> = { datasets: [] };

  constructor(private stockService: StockService) { }

  ngOnInit(): void {
    this.fetchHistoricStockData();
    this.fetchPredictedStockData();
  }

  fetchHistoricStockData(): void {
    this.stockService.getHistoricData(this.ticker, this.startDate).subscribe((data) => {
      this.historicStockData = this.transformData(Object.values(data));
      this.updateHistoricChart();
    });
  }

  fetchPredictedStockData(): void {
    this.stockService.getPredictions(this.ticker, this.endDate).subscribe((data) => {
      this.predictedStockData = this.transformData(Object.values(data));
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
  

  updateHistoricChart(): void {
    this.historicChartData = {
        labels: this.historicStockData.map(data => data.stock_date),
        datasets: [
            {
                label: 'Price',
                data: this.historicStockData.map(data => data.close_price),
                fill: false,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,

            },
        ]
    };
  }

  updatePredictedChart(): void {
    this.predictionChartData = {
        labels: this.predictedStockData.map(data => data.date),
        datasets: [
            {
                label: 'Predicted Price',
                data: this.predictedStockData.map(data => data.price),
                fill: false,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
        ]
    };
  }
}
