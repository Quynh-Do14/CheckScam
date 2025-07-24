import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { RankingService, ReporterRanking, RankingStats } from '../../services/ranking.service';
import { FormsModule } from '@angular/forms';
import { ChatBoxComponent } from "../chat-box/chat-box.component";
import { Title, Meta } from '@angular/platform-browser'; 
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Đăng ký Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, FormsModule, ChatBoxComponent],
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss']
})
export class RankingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('fraudChart', { static: false }) fraudChartRef!: ElementRef<HTMLCanvasElement>;

  // ===== EXISTING PROPERTIES =====
  showChatbox = false;

  // Dữ liệu từ API
  topReporters: ReporterRanking[] = [];
  currentPageReporters: ReporterRanking[] = [];

  // Pagination
  currentPage: number = 0; // API bắt đầu từ 0
  itemsPerPage: number = 10;
  totalPages: number = 0;
  totalElements: number = 0;

  // Stats
  stats: RankingStats = {
    totalReporters: 0,
    totalApprovedReports: 0,
    averageSuccessRate: 0
  };

  // Loading states
  isLoading: boolean = false;
  isLoadingStats: boolean = false;
  error: string | null = null;

  // ===== NEW PROPERTIES FOR CHART =====
  fraudChart: Chart | null = null;
  
  // Dữ liệu biểu đồ tỷ lệ lừa đảo (đã loại bỏ chữ "mới")
  fraudData = [
    { name: 'Hà Nội', rate: 15.5 },
    { name: 'TP. HCM', rate: 14.4 },
    { name: 'Hải Phòng', rate: 14.2 },
    { name: 'Đà Nẵng', rate: 13.75 },
    { name: 'Quảng Ninh', rate: 10.5 },
    { name: 'Thanh Hóa', rate: 9.8 },
    { name: 'Đồng Nai', rate: 8.75 },
    { name: 'Nghệ An', rate: 7.6 },
    { name: 'Khánh Hòa', rate: 6.95 },
    { name: 'Thừa Thiên Huế', rate: 6.9 },
    { name: 'Cần Thơ', rate: 6.73 },
    { name: 'Bắc Ninh', rate: 5.95 },
    { name: 'Lâm Đồng', rate: 5.8 },
    { name: 'An Giang', rate: 5.8 },
    { name: 'Đắk Lắk', rate: 4.7 },
    { name: 'Gia Lai', rate: 4.65 },
    { name: 'Hưng Yên', rate: 4.3 },
    { name: 'Thái Nguyên', rate: 4.2 },
    { name: 'Phú Thọ', rate: 3.93 },
    { name: 'Tây Ninh', rate: 3.85 },
    { name: 'Quảng Ngãi', rate: 3.75 },
    { name: 'Ninh Bình', rate: 3.73 },
    { name: 'Đồng Tháp', rate: 3.65 },
    { name: 'Vĩnh Long', rate: 3.4 },
    { name: 'Quảng Trị', rate: 3.2 },
    { name: 'Cà Mau', rate: 3.2 },
    { name: 'Hà Tĩnh', rate: 3.2 },
    { name: 'Sơn La', rate: 2.9 },
    { name: 'Hòa Bình', rate: 2.7 },
    { name: 'Cao Bằng', rate: 2.6 },
    { name: 'Lạng Sơn', rate: 2.5 },
    { name: 'Lào Cai', rate: 2.5 },
    { name: 'Tuyên Quang', rate: 2.25 },
    { name: 'Lai Châu', rate: 1.8 },
  ];

  constructor(
    private router: Router,
    private rankingService: RankingService,
    private titleService: Title,
    private metaService: Meta
  ) { }

  ngOnInit(): void {
    // Cập nhật Title và Meta Description
    this.titleService.setTitle('Top 10 Xếp Hạng Lừa Đảo AI6 - Săn Người Xấu, Diệt Kẻ Gian');
    this.metaService.updateTag({
      name: 'description',
      content: 'Khám phá top 10 đối tượng gian lận hàng đầu trên AI6. Phân tích lừa đảo qua số điện thoại, URL – dữ liệu uy tín từ Bộ Công An và các trang uy tín. Săn người xấu ngay để diệt kẻ gian!'
    });

    // Load dữ liệu
    this.loadTop3Reporters();
    this.loadCurrentPageData();
    this.loadStats();
    
    // Sắp xếp dữ liệu biểu đồ từ cao đến thấp
    this.fraudData.sort((a, b) => b.rate - a.rate);
  }

  ngAfterViewInit(): void {
    // Khởi tạo biểu đồ sau khi view được render
    setTimeout(() => {
      this.initFraudChart();
    }, 300);
  }

  ngOnDestroy(): void {
    // Hủy biểu đồ khi component bị destroy
    if (this.fraudChart) {
      this.fraudChart.destroy();
    }
  }

  // ===== EXISTING METHODS =====

  // Tải top 3 để hiển thị podium
  loadTop3Reporters(): void {
    this.rankingService.getTop3Reporters().subscribe({
      next: (data) => {
        this.topReporters = data;
      },
      error: (error) => {
        console.error('Error loading top 3 reporters:', error);
        this.error = 'Không thể tải danh sách top 3';
      }
    });
  }

  // Tải dữ liệu cho trang hiện tại
  loadCurrentPageData(): void {
    this.isLoading = true;
    this.error = null;
    this.rankingService.getReporterRanking(this.currentPage, this.itemsPerPage).subscribe({
      next: (response) => {
        this.currentPageReporters = response.reporters;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading ranking data:', error);
        this.error = 'Không thể tải dữ liệu bảng xếp hạng';
        this.isLoading = false;
      }
    });
  }

  // Tải thống kê tổng quan
  loadStats(): void {
    this.isLoadingStats = true;
    this.rankingService.getRankingStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.isLoadingStats = false;
      }
    });
  }

  // Lấy dữ liệu cho trang hiện tại
  getCurrentPageData(): ReporterRanking[] {
    return this.currentPageReporters;
  }

  // Chuyển trang
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadCurrentPageData();
    }
  }

  // Trang trước
  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadCurrentPageData();
    }
  }

  // Trang sau
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadCurrentPageData();
    }
  }

  // Lấy danh sách số trang để hiển thị
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(0, this.currentPage - half);
    let end = Math.min(this.totalPages - 1, start + maxVisible - 1);

    // Điều chỉnh start nếu end đã đạt max
    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Lấy class CSS cho rank
  getRankClass(rank: number): string {
    if (rank <= 3) return 'top-three';
    if (rank <= 10) return 'top-ten';
    return '';
  }

  // Lấy icon medal cho top 3
  getMedalIcon(rank: number): string {
    switch (rank) {
      case 1: return 'fas fa-trophy';
      case 2: return 'fas fa-medal';
      case 3: return 'fas fa-award';
      default: return '';
    }
  }

  // Lấy thống kê để hiển thị
  getTotalReporters(): string {
    return this.stats.totalReporters.toLocaleString('vi-VN');
  }

  getTotalApprovedReports(): string {
    return this.stats.totalApprovedReports.toLocaleString('vi-VN');
  }

  getAverageSuccessRate(): string {
    return this.stats.averageSuccessRate.toFixed(1) + '%';
  }

  // Lấy thời gian hiện tại
  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  // Ẩn 3 ký tự ở giữa của email (bỏ đuôi @domain)
  getMaskedEmail(email: string): string {
    if (!email || email.trim().length === 0) {
      return 'Unknown';
    }

    // Cắt bỏ @gmail.com và các domain khác, chỉ lấy phần username
    const [local] = email.split('@');
    const trimmedLocal = local.trim();

    // Nếu username quá ngắn (≤ 4 ký tự), không ẩn
    if (trimmedLocal.length <= 4) {
      return trimmedLocal;
    }

    // Tìm vị trí giữa để ẩn 3 ký tự
    const totalLength = trimmedLocal.length;
    const hideCount = 3; // Luôn ẩn đúng 3 ký tự

    // Tính vị trí bắt đầu ẩn (ở giữa)
    const startHide = Math.floor((totalLength - hideCount) / 2);
    const endHide = startHide + hideCount;

    // Đảm bảo không ẩn hết username (ít nhất giữ lại 2 ký tự)
    if (startHide < 1 || endHide >= totalLength) {
      return trimmedLocal;
    }

    // Tạo string với 3 ký tự giữa bị ẩn
    const beforeHidden = trimmedLocal.substring(0, startHide);
    const afterHidden = trimmedLocal.substring(endHide);

    return beforeHidden + '***' + afterHidden;
  }

  // Hàm tiện ích: Lấy tên hiển thị với fallback
  getDisplayName(reporter: any): string {
    return this.getMaskedEmail(reporter.email);
  }

  // Lấy thông tin phân trang
  getPaginationInfo(): string {
    const start = this.currentPage * this.itemsPerPage + 1;
    const end = Math.min((this.currentPage + 1) * this.itemsPerPage, this.totalElements);
    return `Hiển thị ${start}-${end} trong tổng số ${this.totalElements} người báo cáo`;
  }

  // Format ngày tháng
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  // Reload dữ liệu
  reloadData(): void {
    this.loadTop3Reporters();
    this.loadCurrentPageData();
    this.loadStats();
  }

  // Chat functions
  onAiTuVanClicked(): void {
    this.showChatbox = true;
  }

  closeChatbox(): void {
    this.showChatbox = false;
  }

  // ===== NEW METHODS FOR SIDEBAR STATS =====
  
  /**
   * Lấy số báo cáo mới trong tuần
   */
  getWeeklyNewReports(): number {
    // Logic tính toán báo cáo mới trong tuần
    // TODO: Kết nối với API thực tế
    return Math.floor(Math.random() * 50) + 20; // Mock data: 20-70 báo cáo
  }

  /**
   * Lấy tỷ lệ tăng trưởng
   */
  getGrowthRate(): string {
    // Logic tính tỷ lệ tăng trưởng so với tuần trước
    // TODO: Kết nối với API thực tế
    const rate = Math.floor(Math.random() * 30) + 5; // Mock data: 5-35%
    return `+${rate}%`;
  }

  /**
   * Lấy số người dùng hoạt động
   */
  getActiveUsers(): number {
    // Logic đếm số người dùng hoạt động trong ngày
    // TODO: Kết nối với API thực tế
    return Math.floor(Math.random() * 100) + 30; // Mock data: 30-130 người
  }

  /**
   * Lấy tiến độ hoàn thành mục tiêu tuần (%)
   */
  getWeeklyProgress(): number {
    // Logic tính tiến độ dựa trên mục tiêu đặt ra
    // TODO: Kết nối với API thực tế
    return Math.floor(Math.random() * 40) + 50; // Mock data: 50-90%
  }

  // ===== FRAUD CHART METHODS =====

  /**
   * Khởi tạo biểu đồ tỷ lệ lừa đảo
   */
  initFraudChart(): void {
    if (!this.fraudChartRef?.nativeElement) {
      console.warn('Fraud chart canvas not found');
      return;
    }

    const ctx = this.fraudChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('Cannot get 2d context from canvas');
      return;
    }

    // Hủy biểu đồ cũ nếu có
    if (this.fraudChart) {
      this.fraudChart.destroy();
    }

    // Tạo màu sắc dựa trên tỷ lệ
    const backgroundColors = this.fraudData.map(item => this.getBarColor(item.rate));
    const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: this.fraudData.map(item => item.name),
        datasets: [{
          label: 'Tỷ lệ lừa đảo (%)',
          data: this.fraudData.map(item => item.rate),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Ẩn legend vì đã có custom legend
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#d97706',
            bodyColor: '#6b7280',
            borderColor: '#fbbf24',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (context) => context[0].label,
              label: (context) => `Tỷ lệ: ${context.parsed.y}%`
            }
          }
        },
        scales: {
          x: {
            display: true,
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              font: {
                size: 8
              },
              color: '#6b7280'
            },
            grid: {
              display: false
            }
          },
          y: {
            display: true,
            beginAtZero: true,
            ticks: {
              font: {
                size: 10
              },
              color: '#6b7280',
              callback: function(value) {
                return value + '%';
              }
            },
            grid: {
              color: 'rgba(107, 114, 128, 0.1)'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    try {
      this.fraudChart = new Chart(ctx, config);
      console.log('Fraud chart initialized successfully');
    } catch (error) {
      console.error('Error initializing fraud chart:', error);
    }
  }

  /**
   * Lấy màu sắc cho cột dựa trên tỷ lệ
   */
  private getBarColor(rate: number): string {
    if (rate >= 15) return 'rgba(220, 38, 38, 0.8)'; // Đỏ đậm - tỷ lệ cao nhất
    if (rate >= 12) return 'rgba(234, 88, 12, 0.8)';  // Cam đỏ
    if (rate >= 9) return 'rgba(245, 158, 11, 0.8)';  // Vàng cam - màu chính
    if (rate >= 7) return 'rgba(234, 179, 8, 0.8)';   // Vàng
    if (rate >= 5) return 'rgba(202, 138, 4, 0.8)';   // Vàng đậm
    if (rate >= 3) return 'rgba(101, 163, 13, 0.8)';  // Xanh lá nhạt
    return 'rgba(22, 163, 74, 0.8)'; // Xanh lá - tỷ lệ thấp nhất
  }

  /**
   * Refresh biểu đồ với dữ liệu mới
   */
  refreshFraudChart(): void {
    if (this.fraudChart) {
      // Cập nhật dữ liệu mới nếu cần
      this.fraudChart.data.datasets[0].data = this.fraudData.map(item => item.rate);
      this.fraudChart.update();
    }
  }

  /**
   * Cập nhật dữ liệu biểu đồ từ API (dành cho tương lai)
   */
  async loadFraudData(): Promise<void> {
    try {
      // TODO: Thay thế bằng API call thực tế
      // const response = await this.httpClient.get<any[]>('/api/fraud-statistics').toPromise();
      // this.fraudData = response.map(item => ({
      //   name: item.provinceName.replace(/\s*\(mới\)/g, ''),
      //   rate: item.fraudRate
      // }));
      
      // Sắp xếp từ cao đến thấp
      this.fraudData.sort((a, b) => b.rate - a.rate);
      
      // Cập nhật biểu đồ
      this.refreshFraudChart();
    } catch (error) {
      console.error('Error loading fraud data:', error);
      // Sử dụng dữ liệu mock hiện tại
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Format số với dấu phẩy
   */
  formatNumber(num: number): string {
    return num.toLocaleString('vi-VN');
  }

  /**
   * Lấy thống kê tổng quan biểu đồ
   */
  getOverallStats() {
    return {
      totalProvinces: this.fraudData.length,
      highestRate: Math.max(...this.fraudData.map(item => item.rate)),
      lowestRate: Math.min(...this.fraudData.map(item => item.rate)),
      averageRate: (this.fraudData.reduce((sum, item) => sum + item.rate, 0) / this.fraudData.length).toFixed(2)
    };
  }

  /**
   * Kiểm tra xem biểu đồ có visible trong viewport không
   */
  private isChartVisible(): boolean {
    const element = this.fraudChartRef?.nativeElement;
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  /**
   * Handle window resize để responsive biểu đồ
   */
  onWindowResize(): void {
    if (this.fraudChart) {
      this.fraudChart.resize();
    }
  }
}