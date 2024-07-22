import { Component, Input } from '@angular/core';
import { ChartData, ChartOptions, Chart, registerables, PluginOptionsByType } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import crosshair from 'chartjs-plugin-crosshair';

Chart.register(...registerables, crosshair);

@Component({
  selector: 'app-stock-chart',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './stock-chart.component.html',
  styles: ""
})
export class StockChartComponent {
    @Input() chartData: ChartData<'line'> = { datasets: [] };
    
    chartOptions: ChartOptions<'line'> & { tooltips: any } = { 
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
        }, 
        plugins: {
            crosshair: {
                line: {
                    color: '#F66', // color of the crosshair line
                    width: 1 // width of the crosshair line
                },
                sync: {
                    enabled: false, // enable trace line syncing with other charts
                    group: 1, // chart group
                    suppressTooltips: false, // suppress tooltips when showing a synced tracer
                },
                zoom: {
                    enabled: true, // enable zooming
                    zoomboxBackgroundColor: 'rgba(66,133,244,0.2)', // background color of zoom box
                    zoomboxBorderColor: '#48F', // border color of zoom box
                    zoomButtonText: 'Reset Zoom', // reset zoom button text
                    zoomButtonClass: 'reset-zoom', // reset zoom button class
                },
                callbacks: {
                    beforeZoom: (start: any, end: any) => true,
                    afterZoom: (start: any, end: any) => { }
                }
            } as any // Add 'as any' to bypass type checking
        } as unknown as PluginOptionsByType<'line'>, // Add the correct type for plugins
        interaction: {
            intersect: false,
            mode: 'index'
        },
        tooltips: {
            intersect: false,
            mode: 'nearest',
            callbacks: {
                label: (tooltipItem: any) => {
                    return `Price: ${tooltipItem.formattedValue}`;
                }
            }
        }
    }
}