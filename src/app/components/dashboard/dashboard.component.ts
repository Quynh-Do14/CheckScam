import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import {
  ChartOptions,
  ChartType,
  ChartData,
  ChartDataset,
  Chart
} from 'chart.js';
import { ReportService } from '../../services/report.service';

interface YearlyStat { year: number; count: number; }
interface MonthlyStat { month: number; count: number; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ CommonModule, FormsModule, NgChartsModule ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  public yearlyChartType: ChartType = 'bar';
  public yearlyChartData!: ChartData<'bar'>;
  public yearlyChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `Báo cáo: ${ctx.parsed.y}` } }
    },
    scales: {
      x: {
        title: { display: true, text: 'Năm', color: '#666' },
        grid: { display: false },
        border: { display: false }
      },
      y: {
        title: { display: true, text: 'Số báo cáo', color: '#666' },
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#666' },
        grid: { color: 'rgba(0,0,0,0.08)' },
        border: { display: false }
      }
    }
  };

  public monthlyChartType: ChartType = 'line';
  public monthlyChartData!: ChartData<'line'>;
  public monthlyChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `Báo cáo: ${ctx.parsed.y}` } }
    },
    scales: {
      x: {
        title: { display: true, text: 'Tháng', color: '#666' },
        grid: { display: false },
        border: { display: false }
      },
      y: {
        title: { display: true, text: 'Số báo cáo', color: '#666' },
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#666' },
        grid: { display: true, color: 'rgba(0,0,0,0.1)', lineWidth: 1, drawTicks: false },
        border: { display: false }
      }
    }
  };

  public availableYears: number[] = [];
  public selectedYear!: number;

  public isLoading: boolean = true; 
  public totalReports: number = 0;
  public reportsThisYear: number = 0;
  public reportsThisMonth: number = 0;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.reportService.getYearlyStats().subscribe({
      next: (stats: YearlyStat[]) => {
        stats.sort((a, b) => a.year - b.year);

        this.availableYears = stats.map(s => s.year);
        this.selectedYear = this.availableYears[this.availableYears.length - 1] || new Date().getFullYear();

        const recentStats = stats.slice(-5);
        this.loadYearlyChart(recentStats);

        this.totalReports = stats.reduce((sum, s) => sum + s.count, 0);
        const currentYearStat = stats.find(s => s.year === this.selectedYear);
        this.reportsThisYear = currentYearStat ? currentYearStat.count : 0;

        this.loadMonthlyChart(this.selectedYear, true);
      },
      error: (err) => {
        console.error('Error fetching yearly stats:', err);
        this.isLoading = false;
      }
    });
  }

  private loadYearlyChart(stats: YearlyStat[]): void {
    const labels = stats.map(s => s.year.toString());
    const data = stats.map(s => s.count);

    const gradientBar = (ctx: any) => {
      const chart = ctx.chart;
      const { ctx: chartCtx, chartArea } = chart;
      if (!chartArea) return null;
      const gradient = chartCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, '#f59e0b');
      gradient.addColorStop(1, '#38bdf8');
      return gradient;
    };

    const ds: ChartDataset<'bar'> = {
      data,
      label: 'Số báo cáo',
      backgroundColor: gradientBar,
      borderColor: '#f59e0b',
      borderWidth: 1,
      borderRadius: 6, 
      hoverBackgroundColor: '#d97706',
      hoverBorderColor: '#b45309'
    };
    this.yearlyChartData = { labels, datasets: [ds] };
  }

  public loadMonthlyChart(year: number, isInitialLoad: boolean = false): void {
    if (!isInitialLoad) {
      this.isLoading = true; 
    }
    this.reportService.getMonthlyStats(year).subscribe({
      next: (stats: MonthlyStat[]) => {
        const map = new Map<number, number>();
        stats.forEach(s => map.set(s.month, s.count));
        const labels: string[] = [];
        const data: number[] = [];
        const currentMonth = new Date().getMonth() + 1; 
        let currentMonthReports = 0;

        for (let m = 1; m <= 12; m++) {
          labels.push(`Tháng ${m}`);
          const count = map.get(m) ?? 0;
          data.push(count);
          if (year === new Date().getFullYear() && m === currentMonth) {
            currentMonthReports = count;
          }
        }
        this.reportsThisMonth = currentMonthReports;

        const gradientLine = (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: chartCtx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = chartCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(56, 189, 248, 0.2)'); 
          gradient.addColorStop(1, 'rgba(245, 158, 11, 0.8)'); 
          return gradient;
        };

        const ds: ChartDataset<'line'> = {
          data,
          label: 'Số báo cáo',
          fill: true, 
          borderColor: '#f59e0b',
          backgroundColor: gradientLine, 
          tension: 0.4, 
          pointBackgroundColor: '#d97706',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#d97706',
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 3,
          pointBorderWidth: 2,
          cubicInterpolationMode: 'monotone' 
        };
        this.monthlyChartData = { labels, datasets: [ds] };
      },
      error: (err) => {
        console.error('Error fetching monthly stats:', err);
      }
    }).add(() => {
      this.isLoading = false;
    });
  }

  public onYearChange(year: string): void {
    this.selectedYear = +year;
    this.loadMonthlyChart(this.selectedYear);
    this.updateReportsThisYear(this.selectedYear);
  }

  private updateReportsThisYear(year: number): void {
    this.reportService.getYearlyStats().subscribe(stats => {
      const currentYearStat = stats.find(s => s.year === year);
      this.reportsThisYear = currentYearStat ? currentYearStat.count : 0;
    });
  }
}