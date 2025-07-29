import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import {
  ChartOptions,
  ChartType,
  ChartData,
  ChartDataset
} from 'chart.js';
import { ReportService } from '../../services/report.service';
import { ForumService } from '../../services/forum.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

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
  // Existing properties...
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
      x: { title: { display: true, text: 'Năm' }, grid: { display: false }, border: { display: false } },
      y: { title: { display: true, text: 'Số báo cáo' }, beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' }, border: { display: false } }
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
      x: { title: { display: true, text: 'Tháng' }, grid: { display: false }, border: { display: false } },
      y: { title: { display: true, text: 'Số báo cáo' }, beginAtZero: true, ticks: { stepSize: 1 }, grid: { display: true, color: 'rgba(0,0,0,0.1)', lineWidth: 1, drawTicks: false }, border: { display: false } }
    }
  };

  public availableYears: number[] = [];
  public selectedYear!: number;

  // Post management properties
  public pendingPosts: any[] = [];
  public postsLoading: boolean = false;
  public activeTab: string = 'reports';
  public selectedPost: any = null;
  
  // Notification properties
  public notifications: any[] = [];
  private notificationId = 0;
  
  // Confirm dialog properties
  public showConfirm = false;
  public confirmTitle = '';
  public confirmMessage = '';
  public confirmCallback: (() => void) | null = null;

  constructor(
    private reportService: ReportService,
    private forumService: ForumService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.reportService.getYearlyStats().subscribe((stats: YearlyStat[]) => {
      stats.sort((a, b) => a.year - b.year);

      this.availableYears = stats.map(s => s.year);
      this.selectedYear = this.availableYears[this.availableYears.length - 1];

      const recentStats = stats.slice(-5);
      this.loadYearlyChart(recentStats);

      this.loadMonthlyChart(this.selectedYear);
    });
  }

  private loadYearlyChart(stats: YearlyStat[]): void {
    const labels = stats.map(s => s.year.toString());
    const data = stats.map(s => s.count);
    const ds: ChartDataset<'bar'> = { data, label: 'Số báo cáo', backgroundColor: '#38bdf8', borderColor: '#0ea5e9', borderWidth: 1, borderRadius: 4 };
    this.yearlyChartData = { labels, datasets: [ds] };
  }

  public loadMonthlyChart(year: number): void {
    this.reportService.getMonthlyStats(year).subscribe((stats: MonthlyStat[]) => {
      const map = new Map<number, number>();
      stats.forEach(s => map.set(s.month, s.count));
      const labels: string[] = [];
      const data: number[] = [];
      for (let m = 1; m <= 12; m++) {
        labels.push(`Tháng ${m}`);
        data.push(map.get(m) ?? 0);
      }

      const ds: ChartDataset<'line'> = { data, label: 'Số báo cáo', fill: false, borderColor: '#38bdf8', tension: 0.3, pointBackgroundColor: '#38bdf8' };
      this.monthlyChartData = { labels, datasets: [ds] };
    });
  }

  public onYearChange(year: string): void {
    this.selectedYear = +year;
    this.loadMonthlyChart(this.selectedYear);
  }

  // Tab management
  switchTab(tabName: string): void {
    this.activeTab = tabName;
    if (tabName === 'posts') {
      this.loadPendingPosts();
    }
  }

  isActiveTab(tabName: string): boolean {
    return this.activeTab === tabName;
  }

  // Load pending posts for approval
  loadPendingPosts(): void {
    this.postsLoading = true;
    
    // Call API to get pending posts (isActive = false)
    const url = `${environment.apiBaseUrl}/forum/posts?status=pending&page=0&size=20`;
    
    this.http.get(url).subscribe({
      next: (response: any) => {
        if (response?.data?.data) {
          this.pendingPosts = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          this.pendingPosts = response.data;
        } else {
          this.pendingPosts = [];
        }
        this.postsLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending posts:', error);
        this.pendingPosts = [];
        this.postsLoading = false;
      }
    });
  }

  // Approve post
  approvePost(postId: number): void {
    const url = `${environment.apiBaseUrl}/forum/posts/${postId}/approve`;
    
    const token = localStorage.getItem('jwt_token');
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      this.showNotification('error', 'Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.');
      return;
    }
    
    this.http.put(url, {}, { headers }).subscribe({
      next: (response) => {
        // Remove from pending list
        this.pendingPosts = this.pendingPosts.filter(post => post.id !== postId);
        this.showNotification('success', 'Duyệt thành công!', 'Bài viết đã được duyệt và hiển thị công khai.');
      },
      error: (error) => {
        if (error.status === 401 || error.status === 403) {
          this.showNotification('error', 'Không có quyền', 'Bạn không có quyền duyệt bài viết. Vui lòng đăng nhập với tài khoản admin.');
        } else if (error.status === 404) {
          this.showNotification('error', 'Không tìm thấy', 'Không tìm thấy bài viết hoặc endpoint API.');
        } else {
          this.showNotification('error', 'Lỗi duyệt bài viết', error.error?.message || error.message || 'Có lỗi xảy ra khi duyệt bài viết.');
        }
      }
    });
  }

  // Reject post with confirmation
  rejectPost(postId: number): void {
    this.showConfirmDialog(
      'Xác nhận từ chối',
      'Bạn có chắc chắn muốn từ chối bài viết này? Hành động này không thể hoàn tác.',
      () => this.performRejectPost(postId)
    );
  }

  // Actually perform reject post
  private performRejectPost(postId: number): void {

    const url = `${environment.apiBaseUrl}/forum/posts/${postId}/reject`;
    
    const token = localStorage.getItem('jwt_token');
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      this.showNotification('error', 'Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.');
      return;
    }
    
    this.http.put(url, {}, { headers }).subscribe({
      next: (response) => {
        // Remove from pending list
        this.pendingPosts = this.pendingPosts.filter(post => post.id !== postId);
        this.showNotification('success', 'Từ chối thành công!', 'Bài viết đã bị từ chối và xóa khỏi hệ thống.');
      },
      error: (error) => {
        if (error.status === 401 || error.status === 403) {
          this.showNotification('error', 'Không có quyền', 'Bạn không có quyền từ chối bài viết. Vui lòng đăng nhập với tài khoản admin.');
        } else if (error.status === 404) {
          this.showNotification('error', 'Không tìm thấy', 'Không tìm thấy bài viết hoặc endpoint API.');
        } else {
          this.showNotification('error', 'Lỗi từ chối bài viết', error.error?.message || error.message || 'Có lỗi xảy ra khi từ chối bài viết.');
        }
      }
    });
  }

  // Get time ago helper
  getTimeAgo(date: Date | string): string {
    if (!date) return '';
    
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const diffInMs = now.getTime() - targetDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return `${diffInDays} ngày trước`;
  }

  // Get display title from post (use content if title is empty)
  getPostDisplayTitle(post: any): string {
    if (post.title && post.title.trim()) {
      return post.title;
    }
    
    if (post.content && post.content.trim()) {
      // Remove HTML tags and get first 50 characters
      const textContent = post.content.replace(/<[^>]*>/g, '').trim();
      return textContent.length > 50 ? textContent.substring(0, 50) + '...' : textContent;
    }
    
    return 'Bài viết không có nội dung';
  }

  // Post detail modal methods
  viewPostDetail(post: any): void {
    this.selectedPost = post;
    // Use Bootstrap modal
    const modal = document.getElementById('postDetailModal');
    if (modal) {
      (modal as any).classList.add('show');
      (modal as any).style.display = 'block';
      document.body.classList.add('modal-open');
      
      // Create backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }
  }

  closePostDetailModal(): void {
    this.selectedPost = null;
    const modal = document.getElementById('postDetailModal');
    if (modal) {
      (modal as any).classList.remove('show');
      (modal as any).style.display = 'none';
      document.body.classList.remove('modal-open');
      
      // Remove backdrop
      const backdrop = document.getElementById('modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    }
  }

  approvePostFromModal(postId: number): void {
    this.approvePost(postId);
    this.closePostDetailModal();
  }

  rejectPostFromModal(postId: number): void {
    this.rejectPost(postId);
    this.closePostDetailModal();
  }

  // Get image URL helper
  getImageUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Use apiUrl (not apiBaseUrl) for images, similar to post-detail component
    if (url.startsWith('/')) {
      return environment.apiUrl + url;
    }
    return environment.apiUrl + '/' + url;
  }

  // Handle image load error
  onImageError(event: any): void {
    console.log('Image failed to load:', event.target.src);
    event.target.style.display = 'none';
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-warning text-center';
    errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Không thể tải ảnh';
    
    // Insert after the failed image
    if (event.target.parentNode) {
      event.target.parentNode.insertBefore(errorDiv, event.target.nextSibling);
    }
  }

  // Notification methods
  showNotification(type: 'success' | 'error' | 'info' | 'warning', title: string, message: string): void {
    const notification = {
      id: ++this.notificationId,
      type: type,
      title: title,
      message: message,
      timestamp: new Date()
    };
    
    this.notifications.unshift(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, 5000);
  }
  
  removeNotification(id: number): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }
  
  getNotificationIcon(type: string): string {
    switch(type) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'info': return 'fas fa-info-circle';
      default: return 'fas fa-bell';
    }
  }
  
  getNotificationClass(type: string): string {
    switch(type) {
      case 'success': return 'alert-success';
      case 'error': return 'alert-danger';
      case 'warning': return 'alert-warning';
      case 'info': return 'alert-info';
      default: return 'alert-secondary';
    }
  }
  
  // Confirm dialog methods
  showConfirmDialog(title: string, message: string, callback: () => void): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmCallback = callback;
    this.showConfirm = true;
  }
  
  onConfirmYes(): void {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.closeConfirmDialog();
  }
  
  onConfirmNo(): void {
    this.closeConfirmDialog();
  }
  
  closeConfirmDialog(): void {
    this.showConfirm = false;
    this.confirmTitle = '';
    this.confirmMessage = '';
    this.confirmCallback = null;
  }
}
