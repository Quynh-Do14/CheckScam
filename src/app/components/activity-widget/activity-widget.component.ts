import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ActivityService, Activity } from '../../services/activity.service';
import { Subscription } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconName } from '@fortawesome/fontawesome-svg-core'; // Đã thêm import này để sửa lỗi Type 'string' is not assignable to type 'IconName'
import { JsonpClientBackend } from '@angular/common/http';

@Component({
  selector: 'app-activity-widget',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule
  ],
  templateUrl: './activity-widget.component.html',
  styleUrls: ['./activity-widget.component.scss']
})
export class ActivityWidgetComponent implements OnInit, OnDestroy {
  recentActivities: Activity[] = [];
  isConnected: boolean = true;
  isLoading: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(private activityService: ActivityService, private router: Router) {}

  ngOnInit() {
    this.initializeWidget();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeWidget() {
    this.isConnected = false;
    this.loadRecentActivities();

    const activitiesSub = this.activityService.getActivities().subscribe(
      activities => {
        this.recentActivities = activities.slice(0, 5);
        this.isLoading = false;
      }
    );
    this.subscriptions.push(activitiesSub);
  }

  private loadRecentActivities() {
    this.isLoading = true;
    this.activityService.getActivities(5, 0).subscribe(
      activities => {
        this.recentActivities = activities;
        this.isLoading = false;
      },
      error => {
        console.error('Error loading activities:', error);
        this.isLoading = false;
        this.recentActivities = [];
      }
    );
  }

  getActionIcon(actionType: string): string {
    const icons: { [key: string]: string } = {
    POST: '🔍', // Bạn có thể thay thế bằng Font Awesome icon tương ứng nếu muốn
    UPLOAD: '📝',
    REPORT: '📤',
    JsonpClientBackendOIN: '👤'
  };

return icons[actionType] || '👤';

}

  getActionText(actionType: string): string {
    const actions: { [key: string]: string } = {
      POST: 'tra cứu/kiểm tra',
      UPLOAD: 'đăng tin tức',
      REPORT: 'gửi báo cáo',
      JOIN: 'tham gia'
    };
    return actions[actionType] || 'thực hiện';
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diff = now.getTime() - activityTime.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'vừa xong';
    if (minutes < 60) return `${minutes}p`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  getRiskClass(activity: Activity): string {
    const metadata = activity.metadata || {};
    if (activity.actionType === 'POST' && metadata.risk_level === 'high') {
      return 'high-risk';
    }
    if (activity.actionType === 'REPORT' && metadata.result === 'scam') {
      return 'scam-detected';
    }
    return '';
  }

  // ĐÃ SỬA: Phương thức canNavigate để không cho phép điều hướng với actionType 'REPORT'
  canNavigate(activity: Activity): boolean {
    // Không thể điều hướng nếu actionType là 'REPORT'
    if (activity.actionType === 'REPORT' || activity.actionType === 'JOIN') {
      return false;
    }
    // Cho phép điều hướng nếu có newsId hoặc reportId và không phải là 'REPORT'
    const metadata = activity.metadata || {};
    return !!(metadata.newsId || metadata.reportId);
  }

  onActivityClick(activity: Activity): void {
    // Chỉ thực hiện điều hướng nếu canNavigate trả về true
    if (!this.canNavigate(activity)) {
      return; // Không làm gì nếu không được phép điều hướng
    }

    const metadata = activity.metadata || {};

    if (metadata.newsId) {
      this.router.navigate(['/view-news', metadata.newsId]);
    } else if (metadata.reportId) {
      this.navigateToReport(metadata.reportId);
    }
  }

  private navigateToReport(reportId: number): void {
    const isAdmin = localStorage.getItem('userRole') === 'ADMIN';

    if (isAdmin) {
      this.router.navigate(['/admin/report-detail', reportId]);
    } else {
      this.router.navigate(['/subject-detail', reportId]);
    }
  }
}