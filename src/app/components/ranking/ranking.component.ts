import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { RankingService, ReporterRanking, RankingStats } from '../../services/ranking.service';
import { FormsModule } from '@angular/forms';
import { ChatBoxComponent } from "../chat-box/chat-box.component";
import { Title, Meta } from '@angular/platform-browser'; 

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, FormsModule, ChatBoxComponent],
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss']
})
export class RankingComponent implements OnInit {
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

  constructor(
    private router: Router,
    private rankingService: RankingService,
    private titleService: Title, // Inject Title service
    private metaService: Meta // Inject Meta service
  ) { }

  ngOnInit(): void {
    // Cập nhật Title và Meta Description khi component được khởi tạo
    this.titleService.setTitle('Top 10 Xếp Hạng Lừa Đảo AI6 - Săn Người Xấu, Diệt Kẻ Gian');
    this.metaService.updateTag({
      name: 'description',
      content: 'Khám phá top 10 đối tượng gian lận hàng đầu trên AI6. Phân tích lừa đảo qua số điện thoại, URL – dữ liệu uy tín từ Bộ Công An và các trang uy tín. Săn người xấu ngay để diệt kẻ gian!'
    });

    this.loadTop3Reporters();
    this.loadCurrentPageData();
    this.loadStats();
  }

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
  // ✅ Hàm tiện ích: Lấy tên hiển thị với fallback
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
  /* ===== Chat ===== */
  onAiTuVanClicked(): void {
    debugger
    this.showChatbox = true;
  }

  closeChatbox(): void {
    debugger
    this.showChatbox = false;
  }
}