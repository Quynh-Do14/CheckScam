import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';

// Import SockJS and Stomp for WebSocket
declare var SockJS: any;
declare var Stomp: any;

export interface Activity {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  actionType: 'SCAN' | 'CHECK' | 'UPLOAD' | 'JOIN' | 'COMMENT';
  targetType?: string;
  targetName: string;
  targetUrl?: string;
  metadata?: string;
  createdAt: string;
  isNew?: boolean;
}

export interface ActivityStats {
  totalScans: number;
  totalChecks: number;
  totalReports: number;
  todayActivities: number;
  totalActivities: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private readonly API_URL = environment.apiBaseUrl;
  private stompClient: any = null;
  
  // Subjects for reactive data streams
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  private newActivitySubject = new BehaviorSubject<Activity | null>(null);
  private statisticsSubject = new BehaviorSubject<ActivityStats>({
    totalScans: 0,
    totalChecks: 0,
    totalReports: 0,
    todayActivities: 0,
    totalActivities: 0
  });

  constructor(private http: HttpClient) {
    this.loadWebSocketLibraries();
  }

  private async loadWebSocketLibraries() {
    try {
      // Load SockJS and Stomp if not available
      if (typeof SockJS === 'undefined') {
        await this.loadScript('https://cdn.jsdelivr.net/npm/sockjs-client@1.6.1/dist/sockjs.min.js');
      }
      if (typeof Stomp === 'undefined') {
        await this.loadScript('https://cdn.jsdelivr.net/npm/@stomp/stompjs@6.1.2/bundles/stomp.umd.min.js');
      }
    } catch (error) {
      console.warn('Failed to load WebSocket libraries:', error);
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  // REST API Methods
  getActivities(limit: number = 50, offset: number = 0, actionType?: string): Observable<Activity[]> {
    let params = `?limit=${limit}&offset=${offset}`;
    if (actionType && actionType !== 'all') {
      params += `&actionType=${actionType}`;
    }
    return this.http.get<Activity[]>(`${this.API_URL}/activities${params}`);
  }

  createActivity(activity: Partial<Activity>): Observable<Activity> {
    return this.http.post<Activity>(`${this.API_URL}/activities`, activity);
  }

  getStatistics(): Observable<ActivityStats> {
    return this.http.get<ActivityStats>(`${this.API_URL}/activities/statistics`);
  }

  getDangerousActivities(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.API_URL}/activities/dangerous`);
  }

  // WebSocket Methods
  connect(): void {
    if (this.stompClient?.connected) {
      return;
    }

    if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
      console.warn('WebSocket libraries not loaded, using HTTP polling fallback');
      this.setupHttpPolling();
      return;
    }

    const socket = new SockJS(`${this.API_URL.replace('/api/v1', '')}/ws`);
    this.stompClient = Stomp.over(socket);

    this.stompClient.connect({}, 
      (frame: any) => {
        console.log('✅ Connected to CheckScam WebSocket');
        this.connectionStatusSubject.next(true);
        
        // Subscribe to activity updates
        this.stompClient.subscribe('/topic/activities', (message: any) => {
          const activity = JSON.parse(message.body);
          this.newActivitySubject.next(activity);
        });
      },
      (error: any) => {
        console.error('WebSocket connection error:', error);
        this.connectionStatusSubject.next(false);
        // Fallback to HTTP polling
        this.setupHttpPolling();
      }
    );
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.disconnect();
      this.connectionStatusSubject.next(false);
    }
  }

  private setupHttpPolling(): void {
    // Fallback: Poll for new activities every 10 seconds
    setInterval(() => {
      this.getActivities(10, 0).subscribe(
        activities => {
          this.activitiesSubject.next(activities);
        }
      );
    }, 10000);

    this.connectionStatusSubject.next(true);
  }

  // Request methods for components
  requestActivities(limit: number = 50, offset: number = 0): void {
    this.getActivities(limit, offset).subscribe(
      activities => {
        this.activitiesSubject.next(activities);
      }
    );
  }

  requestStatistics(): void {
    this.getStatistics().subscribe(
      stats => {
        this.statisticsSubject.next(stats);
      }
    );
  }

  requestDangerousActivities(): void {
    this.getDangerousActivities().subscribe(
      activities => {
        // Handle dangerous activities
        console.log('Dangerous activities:', activities);
      }
    );
  }

  filterActivities(actionType: string, limit: number = 20): void {
    this.getActivities(limit, 0, actionType).subscribe(
      activities => {
        this.activitiesSubject.next(activities);
      }
    );
  }

  // Observable getters
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
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

  // Helper methods for easy logging
  logScanActivity(userId: number, userName: string, website: string, riskLevel: 'low' | 'medium' | 'high'): void {
    const activity = {
      userId: userId,
      userName: userName,
      actionType: 'SCAN' as const,
      targetType: 'website',
      targetName: `Kiểm tra website: ${website}`,
      targetUrl: website,
      metadata: JSON.stringify({
        risk_level: riskLevel,
        scan_duration: '2.1s'
      })
    };

    this.createActivity(activity).subscribe(
      result => {
        console.log('Scan activity logged:', result);
      }
    );
  }

  logCheckActivity(userId: number, userName: string, phone: string, result: 'safe' | 'scam' | 'suspicious'): void {
    const activity = {
      userId: userId,
      userName: userName,
      actionType: 'CHECK' as const,
      targetType: 'phone',
      targetName: `Tra cứu số điện thoại: ${phone}`,
      metadata: JSON.stringify({
        result: result,
        confidence: 95
      })
    };

    this.createActivity(activity).subscribe(
      result => {
        console.log('Check activity logged:', result);
      }
    );
  }

  logReportActivity(userId: number, userName: string, reportType: string, description: string): void {
    const activity = {
      userId: userId,
      userName: userName,
      actionType: 'UPLOAD' as const,
      targetType: 'report',
      targetName: `Báo cáo ${reportType}: ${description}`,
      metadata: JSON.stringify({
        category: reportType,
        severity: 'high'
      })
    };

    this.createActivity(activity).subscribe(
      result => {
        console.log('Report activity logged:', result);
      }
    );
  }
}