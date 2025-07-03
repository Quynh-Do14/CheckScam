import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ActivityService, Activity, ActivityStats } from '../../services/activity.service';
import { Subscription } from 'rxjs';

export interface CreateActivityForm {
  user_id: number;
  action_type: string;
  target_type: string;
  target_name: string;
  target_url: string;
  metadata: string;
}

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './activity-feed.component.html',
  styleUrls: ['./activity-feed.component.scss']
})
export class ActivityFeedComponent implements OnInit, OnDestroy {
  activities: Activity[] = [];
  stats: ActivityStats = {
    totalPosts: 0,
    totalReports: 0,
    totalJoins: 0,
    todayActivities: 0,
    totalActivities: 0,
    connectedClients: 0
  };
  
  currentFilter: string = 'all';
  isConnected: boolean = false;
  isLoading: boolean = true;
  newActivitiesCount: number = 0;
  
  // Form data for creating new activity
  showCreateModal: boolean = false;
  showDangerousModal: boolean = false;
  dangerousActivities: Activity[] = [];
  
  createForm: CreateActivityForm = {
    user_id: 1,
    action_type: 'scan',
    target_type: 'website',
    target_name: '',
    target_url: '',
    metadata: ''
  };

  private subscriptions: Subscription[] = [];

  constructor(private activityService: ActivityService, private router: Router) {}

  ngOnInit() {
    this.initializeActivityFeed();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.activityService.disconnect();
  }

  private initializeActivityFeed() {
    // Connect to activity service
    this.activityService.connect();
    
    // Subscribe to connection status
    const connectionSub = this.activityService.getConnectionStatus().subscribe(
      connected => {
        this.isConnected = connected;
      }
    );
    this.subscriptions.push(connectionSub);

    // Subscribe to activities
    const activitiesSub = this.activityService.getActivitiesStream().subscribe(
      activities => {
        this.activities = activities;
        this.isLoading = false;
      }
    );
    this.subscriptions.push(activitiesSub);

    // Subscribe to new activities
    const newActivitySub = this.activityService.getNewActivity().subscribe(
      activity => {
        if (activity) {
          this.addNewActivity(activity);
        }
      }
    );
    this.subscriptions.push(newActivitySub);

    // Subscribe to statistics
    const statsSub = this.activityService.getStatisticsStream().subscribe(
      stats => {
        this.stats = stats;
      }
    );
    this.subscriptions.push(statsSub);

    // Subscribe to dangerous activities
    const dangerousSub = this.activityService.getDangerousActivitiesStream().subscribe(
      activities => {
        this.dangerousActivities = activities;
      }
    );
    this.subscriptions.push(dangerousSub);

    // Load initial data
    this.loadActivities();
    this.loadStatistics();
  }

  loadActivities() {
    this.activityService.requestActivities();
  }

  loadStatistics() {
    this.activityService.requestStatistics();
  }

  onFilterChange() {
    this.activityService.filterActivities(this.currentFilter);
  }

  addNewActivity(activity: Activity) {
    activity.isNew = true;
    this.activities.unshift(activity);
    this.newActivitiesCount++;
    
    // Show notification for important activities
    if (this.isImportantActivity(activity)) {
      this.showNotification(this.getActivityNotification(activity));
    }

    // Remove new status after 5 seconds
    setTimeout(() => {
      activity.isNew = false;
    }, 5000);

    // Refresh statistics
    this.loadStatistics();

    // Limit activities array size
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(0, 100);
    }
  }

  isImportantActivity(activity: Activity): boolean {
    const metadata = activity.metadata || {};
    return (
      (activity.actionType === 'REPORT') ||
      (activity.actionType === 'UPLOAD' && metadata.category === 'warning') ||  // Sử dụng UPLOAD thay vì POST
      (activity.actionType === 'POST' && metadata.category === 'warning')
    );
  }

  getActivityNotification(activity: Activity): string {
    const metadata = activity.metadata || {};
    
    if (activity.actionType === 'REPORT') {
      return `📋 Báo cáo mới từ ${activity.user.name}: ${activity.targetName}`;
    }
    if ((activity.actionType === 'UPLOAD' || activity.actionType === 'POST') && metadata.category === 'warning') {
      return `⚠️ Bài đăng cảnh báo: ${activity.targetName}`;
    }
    if (activity.actionType === 'UPLOAD') {
      return `📝 Tin tức mới từ ${activity.user.name}: ${activity.targetName}`;
    }
    
    return `📢 ${activity.user.name} ${this.getActionText(activity.actionType)}`;
  }

  showNotification(message: string) {
    // You can integrate with Angular Toastr here
    console.log('Notification:', message);
  }

  getActionIcon(actionType: string): string {
    const icons: { [key: string]: string } = {
      'UPLOAD': '📝',     // Thay đổi icon cho tin tức
      'POST': '📝',
      'REPORT': '📤',
      'JOIN': '👥',
      'post': '📝',
      'upload': '📝',     // Thêm UPLOAD
      'report': '📤',
      'join': '👥'
    };
    return icons[actionType] || '📌';
  }

  getActionText(actionType: string): string {
    const actions: { [key: string]: string } = {
      'UPLOAD': 'đã đăng tin tức',    // Thay đổi text cho UPLOAD
      'POST': 'đã đăng tin tức',
      'REPORT': 'đã gửi báo cáo',
      'JOIN': 'đã tham gia',
      'post': 'đã đăng tin tức',
      'upload': 'đã đăng tin tức',    // Thêm UPLOAD
      'report': 'đã gửi báo cáo',
      'join': 'đã tham gia'
    };
    return actions[actionType] || 'đã thực hiện';
  }

  getRiskLevelClass(metadata: any): string {
    if (!metadata || !metadata.risk_level) return '';
    return `risk-${metadata.risk_level}`;
  }

  translateRiskLevel(level: string): string {
    const levels: { [key: string]: string } = {
      'low': 'Thấp',
      'medium': 'Trung bình', 
      'high': 'Cao'
    };
    return levels[level] || level;
  }

  translateResult(result: string): string {
    const results: { [key: string]: string } = {
      'safe': 'An toàn',
      'scam': 'Lừa đảo',
      'suspicious': 'Nghi vấn'
    };
    return results[result] || result;
  }

  getTimeAgo(timestamp: string): string {
    if (!timestamp) return 'không rõ thời gian';
    
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diff = now.getTime() - activityTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }

  renderMetadata(metadata: any): Array<{text: string, class: string}> {
    if (!metadata) return [];
    
    const tags: Array<{text: string, class: string}> = [];
    
    // Risk level
    if (metadata.risk_level) {
      tags.push({
        text: `Mức độ: ${this.translateRiskLevel(metadata.risk_level)}`,
        class: `risk-${metadata.risk_level}`
      });
    }
    
    // Result
    if (metadata.result) {
      const resultClass = metadata.result === 'scam' ? 'risk-high' : 'risk-low';
      tags.push({
        text: `Kết quả: ${this.translateResult(metadata.result)}`,
        class: resultClass
      });
    }
    
    // Confidence
    if (metadata.confidence) {
      tags.push({
        text: `Độ tin cậy: ${metadata.confidence}%`,
        class: ''
      });
    }
    
    // Reports count
    if (metadata.reports !== undefined) {
      tags.push({
        text: `Báo cáo: ${metadata.reports}`,
        class: ''
      });
    }
    
    // Scan duration
    if (metadata.scan_duration) {
      tags.push({
        text: `Thời gian: ${metadata.scan_duration}`,
        class: ''
      });
    }
    
    // Malware detection
    if (metadata.contains_malware) {
      tags.push({
        text: '⚠️ Chứa malware',
        class: 'risk-high'
      });
    }
    
    // Threats found
    if (metadata.threats_found !== undefined) {
      tags.push({
        text: `Mối đe dọa: ${metadata.threats_found}`,
        class: metadata.threats_found > 0 ? 'risk-high' : 'risk-low'
      });
    }

    return tags;
  }

  // Modal functions
  openCreateModal() {
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resetCreateForm();
  }

  openDangerousModal() {
    this.showDangerousModal = true;
    this.activityService.requestDangerousActivities();
  }

  closeDangerousModal() {
    this.showDangerousModal = false;
  }

  createActivity() {
    const activityData: any = {
      user_id: this.createForm.user_id,
      action_type: this.createForm.action_type,
      target_type: this.createForm.target_type,
      target_name: this.createForm.target_name,
      target_url: this.createForm.target_url || null
    };

    // Parse metadata if provided
    if (this.createForm.metadata) {
      try {
        activityData.metadata = JSON.parse(this.createForm.metadata);
      } catch (error) {
        alert('Metadata JSON không hợp lệ');
        return;
      }
    }

    this.activityService.createActivity(activityData);
    this.closeCreateModal();
  }

  resetCreateForm() {
    this.createForm = {
      user_id: 1,
      action_type: 'post',
      target_type: 'news',
      target_name: '',
      target_url: '',
      metadata: ''
    };
  }

  clearFeed() {
    if (confirm('Bạn có chắc muốn xóa tất cả hoạt động?')) {
      this.activities = [];
      this.newActivitiesCount = 0;
    }
  }

  getActivityItemClass(activity: Activity): string {
    const classes = ['activity-item'];
    
    if (activity.isNew) {
      classes.push('new');
    }
    
    const metadata = activity.metadata || {};
    if (activity.actionType === 'REPORT') {
      classes.push('danger');
    } else if ((activity.actionType === 'UPLOAD' || activity.actionType === 'POST') && metadata.category === 'warning') {
      classes.push('warning');
    }
    
    // Thêm clickable class nếu có thể navigate
    if (this.canNavigate(activity)) {
      classes.push('clickable');
    }
    
    return classes.join(' ');
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
      // Navigate đến trang chi tiết tin tức
      this.router.navigate(['/view-news', metadata.newsId]);
    } else if (metadata.reportId) {
      // Navigate đến trang chi tiết báo cáo (cần kiểm tra quyền admin)
      // Nếu là admin: /admin/report-detail/:id
      // Nếu là user: /subject-detail/:id hoặc tạo page khác
      this.navigateToReport(metadata.reportId);
    }
  }
  
  private navigateToReport(reportId: number): void {
    // Kiểm tra quyền user (nếu có auth service)
    // Đây là ví dụ đơn giản, bạn có thể cần sử dụng AuthService thực tế
    const isAdmin = localStorage.getItem('userRole') === 'ADMIN';
    
    if (isAdmin) {
      this.router.navigate(['/admin/report-detail', reportId]);
    } else {
      // Hoặc navigate đến trang xem báo cáo cho user thường
      this.router.navigate(['/subject-detail', reportId]);
    }
  }
}