import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Activity } from './activity.service';

declare var SockJS: any;
declare var Stomp: any;

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: any = null;
  private readonly WS_URL = 'http://localhost:8080/ws';
  
  // Reactive streams
  private connectionSubject = new BehaviorSubject<boolean>(false);
  private newActivitySubject = new BehaviorSubject<Activity | null>(null);
  private connectedClientsSubject = new BehaviorSubject<number>(0);
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  constructor() {}

  connect(): void {
    if (this.stompClient?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
      console.error('SockJS or STOMP libraries not loaded');
      setTimeout(() => this.connect(), 2000);
      return;
    }
    
    try {
      console.log('Connecting to WebSocket:', this.WS_URL);
      
      // Create SockJS socket WITHOUT credentials
      const socket = new SockJS(this.WS_URL, null, {
        timeout: 15000,
        withCredentials: false, // CRITICAL: disable credentials
        transports: ['websocket', 'xhr-polling']
      });
      
      this.stompClient = Stomp.over(socket);
      
      // Configure STOMP
      this.stompClient.heartbeat.outgoing = 20000;
      this.stompClient.heartbeat.incoming = 20000;
      
      // Disable debug in production
      if (environment.production) {
        this.stompClient.debug = null;
      } else {
        this.stompClient.debug = (msg: string) => {
          console.log('STOMP:', msg);
        };
      }

      // Connect to STOMP WITHOUT credentials
      this.stompClient.connect(
        {}, // Empty headers - no credentials
        (frame: any) => {
          console.log('✅ WebSocket connected successfully:', frame);
          this.connectionSubject.next(true);
          this.reconnectAttempts = 0;
          
          // Subscribe to topics
          this.subscribeToTopics();
        },
        (error: any) => {
          console.error('❌ WebSocket connection error:', error);
          this.connectionSubject.next(false);
          this.handleReconnect();
        }
      );
      
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.connectionSubject.next(false);
      this.handleReconnect();
    }
  }

  private subscribeToTopics(): void {
    if (!this.stompClient?.connected) return;

    try {
      // Subscribe to activity updates
      this.stompClient.subscribe('/topic/activities', (message: any) => {
        try {
          const rawActivity = JSON.parse(message.body);
          const activity: Activity = this.transformActivity(rawActivity);
          
          activity.isNew = true;
          this.newActivitySubject.next(activity);
          
          this.showBrowserNotification(activity);
        } catch (error) {
          console.error('Error processing activity message:', error);
        }
      });

      // Subscribe to statistics updates
      this.stompClient.subscribe('/topic/stats', (message: any) => {
        try {
          const stats = JSON.parse(message.body);
          if (stats.connectedClients !== undefined) {
            this.connectedClientsSubject.next(stats.connectedClients);
          }
        } catch (error) {
          console.error('Error processing stats message:', error);
        }
      });

      console.log('Successfully subscribed to WebSocket topics');
      
    } catch (error) {
      console.error('Error subscribing to topics:', error);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);
      
      console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.stompClient?.connected) {
      this.stompClient.disconnect(() => {
        console.log('WebSocket disconnected');
        this.connectionSubject.next(false);
      });
    }
    this.stompClient = null;
  }

  sendActivity(activity: Partial<Activity>): void {
    if (this.stompClient?.connected) {
      try {
        this.stompClient.send('/app/activity', {}, JSON.stringify(activity));
      } catch (error) {
        console.error('Error sending activity:', error);
      }
    } else {
      console.warn('Cannot send activity: WebSocket not connected');
    }
  }

  // Observable getters
  getConnectionStatus(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  getNewActivity(): Observable<Activity | null> {
    return this.newActivitySubject.asObservable();
  }

  getConnectedClients(): Observable<number> {
    return this.connectedClientsSubject.asObservable();
  }

  private showBrowserNotification(activity: Activity): void {
    if (!this.isImportantActivity(activity)) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      const title = '🛡️ CheckScam Alert';
      const options = {
        body: this.getNotificationMessage(activity),
        icon: '/assets/icons/checkscam-icon.png',
        tag: 'checkscam-activity',
        renotify: true,
        requireInteraction: false
      };

      const notification = new Notification(title, options);
      setTimeout(() => notification.close(), 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  private isImportantActivity(activity: Activity): boolean {
    const metadata = activity.metadata || {};
    return (
      (activity.actionType === 'REPORT') ||
      (activity.actionType === 'POST' && metadata.category === 'warning')
    );
  }

  private getNotificationMessage(activity: Activity): string {
    const metadata = activity.metadata || {};
    
    if (activity.actionType === 'REPORT') {
      return `📋 Báo cáo mới từ ${activity.userName}: ${activity.targetName}`;
    }
    if (activity.actionType === 'POST' && metadata.category === 'warning') {
      return `⚠️ Bài đăng cảnh báo: ${activity.targetName}`;
    }
    
    return `${activity.userName} ${this.getActionText(activity.actionType)} ${activity.targetName}`;
  }

  private getActionText(actionType: string): string {
    const actions: { [key: string]: string } = {
      'SCAN': 'đã quét kiểm tra',
      'CHECK': 'đã tra cứu',
      'UPLOAD': 'đã báo cáo',
      'JOIN': 'đã tham gia',
      'COMMENT': 'đã bình luận về',
      'POST': 'đã đăng',
      'REPORT': 'đã báo cáo'
    };
    return actions[actionType] || 'đã thực hiện';
  }

  requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied');
  }

  private transformActivity(activity: any): Activity {
    let metadata = activity.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = {};
      }
    }

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
      user: {
        id: activity.userId || activity.user?.id || 0,
        name: userName,
        avatar: userAvatar
      }
    };
  }

  private mapActionType(actionType: string): 'POST' | 'REPORT' | 'JOIN' {
    const mappings: { [key: string]: 'POST' | 'REPORT' | 'JOIN' } = {
      'SCAN': 'POST',
      'CHECK': 'POST', 
      'UPLOAD': 'REPORT',
      'COMMENT': 'POST',
      'LIKE': 'POST',
      'SHARE': 'POST',
      'POST': 'POST',
      'REPORT': 'REPORT',
      'JOIN': 'JOIN'
    };
    return mappings[actionType] || 'POST';
  }
}
