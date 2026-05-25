import { Component, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexPlotOptions,
  ApexYAxis,
  ApexLegend,
  ApexStroke,
  ApexXAxis,
  ApexFill,
  ApexTooltip,
  ApexTitleSubtitle,
  ApexGrid,
  ApexResponsive,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { CommonService } from '../../../../src/app/shared/common/common.service';
import { routes } from '../../../../src/app/shared/routes/routes';
import { SettingsService } from '../../../../src/app/shared/settings/settings.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';

export type ChartOptions = {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  dataLabels: ApexDataLabels | any;
  plotOptions: ApexPlotOptions | any;
  yaxis: ApexYAxis | any;
  xaxis: ApexXAxis | any;
  fill: ApexFill | any;
  tooltip: ApexTooltip | any;
  stroke: ApexStroke | any;
  legend: ApexLegend | any;
  title: ApexTitleSubtitle | any;
  colors: string[] | any;
  subtitle: ApexTitleSubtitle | any;
  grid: ApexGrid | any;
  responsive:ApexResponsive | any;
  labels:ApexDataLabels | any;

};

@Component({
  selector: 'app-modal-dashboard',
  templateUrl: './modal-dashboard.component.html',
  styleUrls: ['./modal-dashboard.component.scss'],
  imports:[NgApexchartsModule,CommonModule,RouterLink,FormsModule,DatePickerModule]
})
export class ModalDashboardComponent {
routes=routes
  date: Date[] | undefined;
  base=''
@ViewChild('chart') chart!: ChartComponent;
public barChart: Partial<ChartOptions>;
public barChart2: Partial<ChartOptions>;
public lineChart: Partial<ChartOptions>;
public lineChart2: Partial<ChartOptions>;
public appointmentChart: Partial<ChartOptions>;
public circleChart: Partial<ChartOptions>;
  constructor( private common: CommonService,private layout:SettingsService) {
    this.common.baseRoute.subscribe((res: string) => {
      this.base = res;
      if (this.base === 'layout-default'){
        layout.changeLayoutMode('default');
      }else if (this.base === 'layout-mini'){
        layout.changeLayoutMode('mini');
      }else if (this.base === 'layout-hover-view'){
        layout.changeLayoutMode('hoverview');
      }else if (this.base === 'layout-hidden'){
        layout.changeLayoutMode('hidden');
      }else if (this.base === 'layout-rtl'){
        layout.changeLayoutMode('rtl');
      }else if (this.base === 'layout-full-width'){
        layout.changeLayoutMode('full-width');
      }else if (this.base === 'layout-dark'){
        layout.changeThemeColor('dark');
      }else {
        layout.changeThemeColor('light');
        // layout.changeLayoutMode('1');
        // layout.changeLayoutWidth('1');
        // layout.changeThemeColor('1');
      }
    });
    this.barChart= {
        chart:{
        width: 80,
        height: 54,
        type: 'bar',
        toolbar: { show: false },
        sparkline: { enabled: true }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '70%',
          borderRadius: 3,
          endingShape: 'rounded'
        }
      },
      dataLabels: { enabled: false },
      stroke: { show: false },
      series: [{
        name: 'Data',
        data: [
          { x: 'A', y: 40, fillColor: '#2E37A4' },
          { x: 'B', y: 15, fillColor: '#2E37A4' },
          { x: 'C', y: 60, fillColor: '#2E37A4' },
          { x: 'D', y: 15, fillColor: '#2E37A4' },
          { x: 'E', y: 90, fillColor: '#FF955A' },
          { x: 'F', y: 20, fillColor: '#2E37A4' },
          { x: 'G', y: 70, fillColor: '#2E37A4' }
        ],
         show:false
      }],
      xaxis: {
        labels: { show: false },
        axisTicks: { show: false },
        axisBorder: { show: false },
      },
      yaxis: { show: false },
      grid: { show: false },
      tooltip: { enabled: false },
      
    };
    this.lineChart={
      chart: {
        width: 100,
        height: 54,
        type: 'area',
        toolbar: { show: false },
        sparkline: { enabled: true }
      },
      stroke: {
        curve: 'smooth',
        width: 1,
        colors: ['#F36C3D']  // orange line
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0,
          stops: [0, 90, 100],
          colorStops: [
            {
              offset: 0,
              color: "#F36C3D",
              opacity: 0.4
            },
            {
              offset: 100,
              color: "#ffffff",
              opacity: 0.8
            }
          ]
        }
      },
      dataLabels: { enabled: false },
      series: [{
        name: 'Data',
        data: [22, 35, 30, 40, 28, 45, 40] // You can adjust these
      }],
      xaxis: {
        labels: { show: false },
        axisTicks: { show: false },
        axisBorder: { show: false }
      },
      yaxis: { show: false },
      grid: { show: false },
      tooltip: { enabled: false }
    }
    this.barChart2={
      chart: {
        width: 80,
        height: 54,
        type: 'bar',
        toolbar: { show: false },
        sparkline: { enabled: true }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '70%',
          borderRadius: 0,
          endingShape: 'rounded'
        }
      },
      dataLabels: { enabled: false },
      stroke: { show: false },
      series: [{
        name: 'Data',
        data: [
          { x: 'A', y: 80, fillColor: '#06AED4' },
          { x: 'B', y: 35, fillColor: '#06AED4' },
          { x: 'C', y: 50, fillColor: '#06AED4' },
          { x: 'D', y: 45, fillColor: '#06AED4' },
          { x: 'E', y: 35, fillColor: '#06AED4' },
          { x: 'F', y: 60, fillColor: '#06AED4' },
          { x: 'G', y: 50, fillColor: '#06AED4' }
        ]
      }],
      xaxis: {
        labels: { show: false },
        axisTicks: { show: false },
        axisBorder: { show: false }
      },
      yaxis: { show: false },
      grid: { show: false },
      tooltip: { enabled: false }
    }
    this.lineChart2={
      chart: {
        width: 100,
        height: 54,
        type: 'area',
        toolbar: { show: false },
        sparkline: { enabled: true }
      },
      stroke: {
        curve: 'smooth',
        width: 2,
        colors: ['#008073']  // consistent green stroke
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.5,
          opacityTo: 0,
          stops: [0, 90, 100],
          colorStops: [
            {
              offset: 0,
              color: "#008073",
              opacity: 0.4
            },
            {
              offset: 100,
              color: "#ffffff",
              opacity: 0.1
            }
          ]
        }
      },
      dataLabels: { enabled: false },
      series: [{
        name: 'Data',
        data: [20, 12, 9, 14, 18, 25, 30, 28, 35, 40]
      }],
      xaxis: {
        labels: { show: false },
        axisTicks: { show: false },
        axisBorder: { show: false }
      },
      yaxis: { show: false },
      grid: { show: false },
      tooltip: { enabled: false }
    }
    this.appointmentChart={
    chart: {
      type: 'bar',
      height: 250,
      stacked: true,
      toolbar: { show: false },
      sparkline: { enabled: false }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '25%',
        borderRadius: 3,
        distributed: false
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 0,
      colors: ['#fff']
    },
    series: [
      {
        name: 'Completed',
        data: [800, 1000, 1200, 1300, 1500, 700, 900, 1000, 1600, 1500, 1200, 1100]
      },
      {
        name: 'Ongoing',
        data: [700, 900, 1100, 1000, 1100, 600, 800, 950, 1300, 1200, 1000, 950]
      },
      {
        name: 'Rescheduled',
        data: [600, 700, 1100, 1100, 1900, 500, 700, 850, 1500, 1600, 900, 850]
      }
    ],
    colors: ['#00D1D1', '#1E90FF', '#3B28CC'],
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: {
        style: {
          fontSize: '14px',
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      tickPlacement: 'between'
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '14px'
        },
        formatter: function (val:any) {
          return (val / 1000) + 'K';
        },
        offsetX: -10 // Move y-axis labels 10px left
      }
    },
    legend: {
      position: 'bottom'
    },
    grid: {
      show: true,
      strokeDashArray: 4,
      padding: {
        left: 0,  // Set to 0 or higher to avoid label clipping
        right: -10
      }
    },
    tooltip: { enabled: true }
  }
  this.circleChart={
      chart: {
        type: 'donut',
        height: 270,
        width: '100%'
      },
      series: [219, 200, 219],  // Replace with your values
      labels: ['214 Cardiology', '121 Neurolgy',  '150 Dental'],
      colors: ['#6DA6F2', '#5C60CC', '#9B51B6'], // Match to your image colors
      legend: {
        show: false
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 2,
        colors: ['#fff']
      },
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '16px',
                fontWeight: 400,
                offsetY: -10,
                color: '#0A1B39'
              },
              value: {
                show: true,
                fontSize: '18px',
                fontWeight: 700,
                offsetY: 10,
                color: '#0A1B39'
              },
              total: {
                show: true,
                label: 'Total Patient',
                fontSize: '14px',
                color: '#0A1B39',
                formatter: function (w:any) {
                  return w.globals.seriesTotals.reduce((a:any, b:any) => a + b, 0);
                }
              }
            }
          }
        }
      },
      tooltip: {
        enabled: true
      }
    }
  }

  ngOnDestroy(): void {
    this.layout.layoutMode.next('default');
    this.layout.themeColor.next('light');
    this.layout.changeLayoutMode('default');
    this.layout.changeLayoutWidth('fluid');
    this.layout.changeThemeColor('light');
  }
}
