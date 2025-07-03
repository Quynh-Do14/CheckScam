import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ActivityService, Activity } from '../../services/activity.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-activity-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './activity-widget.component.html',
  styleUrls: ['./activity-widget.component.scss']
})
export class ActivityWidgetComponent implements OnInit, OnDestroy {
  recentActivities: Activity[] = [];
  isConnected: boolean = false;
  isLoading: boolean = true;

  private subscriptions: Subscription[] = [];

  constructor(private activityService: ActivityService, private router: Router) {}

  ngOnInit() {
    this.initializeWidget();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeWidget() {
    // Connect to activity service
    this.activityService.connect();
    
    // Subscribe to connection status
    const connectionSub = this.activityService.getConnectionStatus().subscribe(
      connected => {
        this.isConnected = connected;
        if (connected) {
          this.loadRecentActivities();
        }
      }
    );
    this.subscriptions.push(connectionSub);

    // Subscribe to activities - limit to 5 for widget
    const activitiesSub = this.activityService.getActivities().subscribe(
      activities => {
        this.recentActivities = activities.slice(0, 5);
        this.isLoading = false;
      }
    );
    this.subscriptions.push(activitiesSub);

    // Subscribe to new activities
    const newActivitySub = this.activityService.getNewActivity().subscribe(
      activity => {
        if (activity) {
          this.recentActivities.unshift(activity);
          // Keep only 5 recent activities
          this.recentActivities = this.recentActivities.slice(0, 5);
        }
      }
    );
    this.subscriptions.push(newActivitySub);
  }

  private loadRecentActivities() {
    this.activityService.requestActivities(5, 0);
  }

  getActionIcon(actionType: string): string {
    const icons: { [key: string]: string } = {
      POST: '🔍',
      UPLOAD: '📝',     // UPLOAD = đăng tin tức
      REPORT: '📤',     // REPORT = gửi báo cáo
      JOIN: '👥'
    };
    return icons[actionType] || '📌';
  }

  getActionText(actionType: string): string {
    const actions: { [key: string]: string } = {
      POST: 'tra cứu/kiểm tra',
      UPLOAD: 'đăng tin tức',    // UPLOAD = đăng tin tức
      REPORT: 'gửi báo cáo',     // REPORT = gửi báo cáo
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
  
  // Kiểm tra xem activity có thể navigate không
  canNavigate(activity: Activity): boolean {
    const metadata = activity.metadata || {};
    return !!(metadata.newsId || metadata.reportId);
  }
  
  // Handle click vào activity
  onActivityClick(activity: Activity): void {
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