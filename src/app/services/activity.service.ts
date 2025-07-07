import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';
// import { WebSocketService } from './websocket.service'; // COMMENTED: Tạm thời không dùng WebSocket

export interface Activity {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  actionType: 'POST' | 'UPLOAD' | 'REPORT' | 'JOIN';  // Thêm UPLOAD
  targetType?: string;
  targetName: string;
  targetUrl?: string;
  metadata?: any;
  createdAt: string;
  isNew?: boolean;
  // UI compatibility properties
  user: {
    id: number;
    name: string;
    email?: string;
    avatar: string;
  };
}

export interface ActivityStats {
  totalPosts: number;  // Đối với backend sử dụng UPLOAD nhưng frontend vẫn hiển thị là "posts"
  totalReports: number;
  totalJoins: number;
  todayActivities: number;
  totalActivities: number;
  connectedClients?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private readonly API_URL = environment.apiBaseUrl + '/activities';
  
  // Subjects for reactive data streams
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  private newActivitySubject = new BehaviorSubject<Activity | null>(null);
  private statisticsSubject = new BehaviorSubject<ActivityStats>({
    totalPosts: 0,
    totalReports: 0,
    totalJoins: 0,
    todayActivities: 0,
    totalActivities: 0
  });
  private dangerousActivitiesSubject = new BehaviorSubject<Activity[]>([]);

  constructor(
    private http: HttpClient,
    // private websocketService: WebSocketService // COMMENTED: Tạm thời không dùng WebSocket
  ) {
    // COMMENTED: Initialize WebSocket connection
    // this.websocketService.connect();
    
    // COMMENTED: Request notification permission
    // this.websocketService.requestNotificationPermission();
    
    // COMMENTED: Subscribe to WebSocket new activities
    // this.websocketService.getNewActivity().subscribe(newActivity => {
    //   if (newActivity) {
    //     this.newActivitySubject.next(newActivity);
    //     
    //     // Add to activities list
    //     const currentActivities = this.activitiesSubject.value;
    //     const updatedActivities = [newActivity, ...currentActivities].slice(0, 100);
    //     this.activitiesSubject.next(updatedActivities);
    //     
    //     // Refresh statistics
    //     this.requestStatistics();
    //   }
    // });
  }

  // REST API Methods
  getActivities(limit: number = 50, offset: number = 0, actionType?: string): Observable<Activity[]> {
    let params = `?limit=${limit}&offset=${offset}`;
    if (actionType && actionType !== 'all') {
      params += `&actionType=${actionType}`;
    }
    
    return this.http.get<any>(`${this.API_URL}${params}`).pipe(
      map(response => (response.data || []).map((activity: any) => this.transformActivity(activity)))
    );
  }

  createActivity(activity: Partial<Activity>): Observable<Activity> {
    return this.http.post<any>(`${this.API_URL}`, activity).pipe(
      map(response => this.transformActivity(response.data))
    );
  }

  getStatistics(): Observable<ActivityStats> {
    return this.http.get<any>(`${this.API_URL}/statistics`).pipe(
      map(response => {
        const stats = response.data || {};
        return {
          ...stats,
          connectedClients: stats.connectedClients || 0
        };
      })
    );
  }

  getDangerousActivities(): Observable<Activity[]> {
    return this.http.get<any>(`${this.API_URL}/dangerous`).pipe(
      map(response => (response.data || []).map((activity: any) => this.transformActivity(activity)))
    );
  }

  getUserActivities(userId: number, limit: number = 20): Observable<Activity[]> {
    return this.http.get<any>(`${this.API_URL}/user/${userId}?limit=${limit}`).pipe(
      map(response => (response.data || []).map((activity: any) => this.transformActivity(activity)))
    );
  }

  // COMMENTED: Connection management
  connect(): void {
    // this.websocketService.connect(); // COMMENTED: Tạm thời không dùng WebSocket
    console.log('WebSocket connection disabled');
  }

  disconnect(): void {
    // this.websocketService.disconnect(); // COMMENTED: Tạm thời không dùng WebSocket
    console.log('WebSocket disconnect disabled');
  }

  // Request methods for components
  requestActivities(limit: number = 50, offset: number = 0): void {
    this.getActivities(limit, offset).subscribe(
      activities => {
        this.activitiesSubject.next(activities);
      },
      error => {
        console.error('Error loading activities:', error);
        this.activitiesSubject.next([]);
      }
    );
  }

  requestStatistics(): void {
    this.getStatistics().subscribe(
      stats => {
        this.statisticsSubject.next(stats);
      },
      error => {
        console.error('Error loading statistics:', error);
      }
    );
  }

  requestDangerousActivities(): void {
    this.getDangerousActivities().subscribe(
      activities => {
        this.dangerousActivitiesSubject.next(activities);
      },
      error => {
        console.error('Error loading dangerous activities:', error);
      }
    );
  }

  filterActivities(actionType: string, limit: number = 20): void {
    this.getActivities(limit, 0, actionType).subscribe(
      activities => {
        this.activitiesSubject.next(activities);
      },
      error => {
        console.error('Error filtering activities:', error);
      }
    );
  }

  // COMMENTED: Observable getters
  getConnectionStatus(): Observable<boolean> {
    // return this.websocketService.getConnectionStatus(); // COMMENTED: Tạm thời không dùng WebSocket
    return new BehaviorSubject<boolean>(false).asObservable(); // Return false as not connected
  }

  getActivitiesStream(): Observable<Activity[]> {
    return this.activitiesSubject.asObservable();
  }

  getNewActivity(): Observable<Activity | null> {
    return this.newActivitySubject.asObservable();
  }

  getStatisticsStream(): Observable<ActivityStats> {
    return this.statisticsSubject.asObservable();
  }

  getDangerousActivitiesStream(): Observable<Activity[]> {
    return this.dangerousActivitiesSubject.asObservable();
  }

  // Helper methods for easy logging
  logPostActivity(userId: number, userName: string, postTitle: string, category: string = 'general'): void {
    this.http.post<any>(`${this.API_URL}/log/post`, null, {
      params: {
        userId: userId.toString(),
        userName: userName,
        postTitle: postTitle,
        category: category
      }
    }).subscribe(
      result => {
        this.requestActivities();
      },
      error => {
        console.error('Error logging post activity:', error);
      }
    );
  }

  logReportActivity(userId: number, userName: string, reportTitle: string, reportType: string): void {
    this.http.post<any>(`${this.API_URL}/log/report`, null, {
      params: {
        userId: userId.toString(),
        userName: userName,
        reportTitle: reportTitle,
        reportType: reportType
      }
    }).subscribe(
      result => {
        this.requestActivities();
      },
      error => {
        console.error('Error logging report activity:', error);
      }
    );
  }

  logJoinActivity(userId: number, userName: string, joinedItem: string): void {
    this.http.post<any>(`${this.API_URL}/log/join`, null, {
      params: {
        userId: userId.toString(),
        userName: userName,
        joinedItem: joinedItem
      }
    }).subscribe(
      result => {
        this.requestActivities();
      },
      error => {
        console.error('Error logging join activity:', error);
      }
    );
  }

  // Helper method to transform backend activity to frontend format
  private transformActivity(activity: any): Activity {
    // Parse metadata if it's a string
    let metadata = activity.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = {};
      }
    }

    // Ensure we have required fields with defaults
    const userName = activity.userName || activity.user?.name || 'Unknown User';
    const userAvatar = activity.userAvatar || activity.user?.avatar || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=e74c3c&color=fff`;
    const targetName = activity.targetName || activity.target_name || 'Unknown Target';
    const createdAt = activity.createdAt || activity.created_at || new Date().toISOString();

    return {
      id: activity.id || 0,
      userId: activity.userId || activity.user?.id || 0,
      userName: userName,
      userAvatar: userAvatar,
      actionType: this.mapActionType(activity.actionType) || 'POST',
      targetType: activity.targetType,
      targetName: targetName,
      targetUrl: activity.targetUrl || activity.target_url,
      metadata: metadata,
      createdAt: createdAt,
      isNew: activity.isNew || false,
      // UI compatibility properties - always required
      user: {
        id: activity.userId || activity.user?.id || 0,
        name: userName,
        avatar: userAvatar
      }
    };
  }

  // Helper method to map old action types to new ones
  private mapActionType(actionType: string): 'POST' | 'UPLOAD' | 'REPORT' | 'JOIN' {
    const mappings: { [key: string]: 'POST' | 'UPLOAD' | 'REPORT' | 'JOIN' } = {
      'SCAN': 'POST',
      'CHECK': 'POST', 
      'UPLOAD': 'UPLOAD',    // UPLOAD = đăng tin tức
      'COMMENT': 'POST',
      'LIKE': 'POST',
      'SHARE': 'POST',
      'POST': 'POST',
      'REPORT': 'REPORT',    // REPORT = gửi báo cáo
      'JOIN': 'JOIN'
    };
    return mappings[actionType] || 'POST';
  }
}