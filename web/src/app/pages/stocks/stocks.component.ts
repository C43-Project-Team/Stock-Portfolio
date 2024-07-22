import { Component, OnInit } from '@angular/core';
import type { HistoricStockInterface } from './historicStock.interface';
import type { PredictedStockInterface } from './predictedStock.interface';
import { StockService } from '@services/stocks.service';
import { ChartData } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { LayoutComponent } from "../layout/layout.component";
import { StockChartComponent } from "../../components/stock-chart/stock-chart.component";
import { ActivatedRoute } from '@angular/router';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [ChartModule, LayoutComponent, StockChartComponent, CalendarModule, FormsModule, FloatLabelModule],
  templateUrl: './stocks.component.html',
  styles: []
})

export class StocksComponent implements OnInit {
  historicStockData: HistoricStockInterface[] = [];
  predictedStockData: PredictedStockInterface[] = [];
  ticker: string = "";
  startDate: Date = new Date("2020-07-31");
  endDate: Date = new Date("2024-12-08");

  historicChartData: ChartData<'line'> = { datasets: [] };
  predictionChartData: ChartData<'line'> = { datasets: [] };

  constructor(private stockService: StockService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
        this.ticker = params['ticker'];
        this.fetchHistoricStockData();
        this.fetchPredictedStockData();
    });
  }

  fetchHistoricStockData(): void {
    const historyStart = this.startDate.toISOString().split('T')[0];
    this.stockService.getHistoricData(this.ticker, historyStart).subscribe((data) => {
      this.historicStockData = this.transformData(Object.values(data));
      console.log(this.historicStockData);
      this.updateHistoricChart();
    });
  }

  fetchPredictedStockData(): void {
    const predictEnd = this.endDate.toISOString().split('T')[0];
    this.stockService.getPredictions(this.ticker, predictEnd).subscribe((data) => {
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

  onStartDateChange(event: any): void {
    this.startDate = event;
    this.fetchHistoricStockData();
  }

  onEndDateChange(event: any): void {
    this.endDate = event;
    this.fetchPredictedStockData();
  }

}
