import { Component, Input, input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-stock-chart',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './stock-chart.component.html',
  styles: ""
})
export class StockChartComponent {
    @Input() chartData: ChartData<'line'> = { datasets: [] };
    
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
    }
}