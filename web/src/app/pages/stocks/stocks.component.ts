import { Component, OnInit } from '@angular/core';
import type { HistoricStockInterface } from './historicStock.interface';
import type { PredictedStockInterface } from './predictedStock.interface';
import { StockService } from './stocks.service';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [ChartModule],
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
  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Price'
        }
      }
    }
  };

  constructor(private stockService: StockService) { }

  ngOnInit(): void {
    this.fetchHistoricStockData();
    this.fetchPredictedStockData();
  }

  fetchHistoricStockData(): void {
    this.stockService.getHistoricData(this.ticker, this.startDate).subscribe((data) => {
      console.log("history: ", Object.values(data));
      this.historicStockData = Object.values(data);
      this.updateHistoricChart();
    });
  }

  fetchPredictedStockData(): void {
    this.stockService.getPredictions(this.ticker, this.endDate).subscribe((data) => {
      console.log("prediction: ", Object.values(data));
      this.predictedStockData = Object.values(data);
      this.updatePredictedChart();
    });
  }

  updateHistoricChart(): void {
    if (this.historicStockData && Array.isArray(this.historicStockData) && this.historicStockData.length > 0) {
      const innerData = this.historicStockData[0];
  
      if (Array.isArray(innerData) && innerData.length > 0) {
        this.historicChartData = {
          labels: innerData.map(data => data.stock_date),
          datasets: [
            {
              label: 'Price',
              data: innerData.map(data => data.close_price),
              fill: false,
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            },
          ]
        };
        console.log("historicChartData: ", this.historicChartData);
      } else {
        console.error("Invalid innerData structure:", innerData);
      }
    } else {
      console.error("Invalid historicStockData:", this.historicStockData);
    }
  }
  
  
  

  updatePredictedChart(): void {
    if (this.predictedStockData && Array.isArray(this.predictedStockData) && this.predictedStockData.length > 0) {
      const innerData = this.predictedStockData[0];
  
      if (Array.isArray(innerData) && innerData.length > 0) {
        this.predictionChartData = {
          labels: innerData.map(data => data.date),
          datasets: [
            {
              label: 'Price',
              data: innerData.map(data => data.price),
              fill: false,
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            },
          ]
        };
        console.log("predictionChartData: ", this.predictionChartData);
      } else {
        console.error("Invalid innerData structure:", innerData);
      }
    } else {
      console.error("Invalid predictedStockData:", this.predictedStockData);
    }
  }
}
