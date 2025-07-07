import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Activity } from './activity.service';

@Injectable({
  providedIn: 'root'
})
export class SimpleWebSocketService {
  // COMMENTED: Tạm thời disable toàn bộ SimpleWebSocketService
  private socket: WebSocket | null = null;
  private readonly WS_URL = 'wss://api-v1.ai6.vn/ws-simple';
  
  // Reactive streams
  private connectionSubject = new BehaviorSubject<boolean>(false);
  private newActivitySubject = new BehaviorSubject<Activity | null>(null);
  private connectedClientsSubject = new BehaviorSubject<number>(0);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {}

  connect(): void {
    // COMMENTED: WebSocket connection disabled
    console.log('SimpleWebSocketService: WebSocket connection disabled');
    this.connectionSubject.next(false);
    
    // if (this.socket && this.socket.readyState === WebSocket.OPEN) {
    //   console.log('WebSocket already connected');
    //   return;
    // }

    // try {
    //   this.socket = new WebSocket(this.WS_URL);
    //   
    //   this.socket.onopen = (event) => {
    //     console.log('✅ Simple WebSocket connected');
    //     this.connectionSubject.next(true);
    //     this.reconnectAttempts = 0;
    //     
    //     // Send a ping to establish connection
    //     this.send({ type: 'ping' });
    //   };

    //   this.socket.onmessage = (event) => {
    //     try {
    //       const data = JSON.parse(event.data);
    //       this.handleMessage(data);
    //     } catch (error) {
    //       console.error('Error parsing WebSocket message:', error);
    //     }
    //   };

    //   this.socket.onclose = (event) => {
    //     console.log('WebSocket connection closed:', event.code, event.reason);
    //     this.connectionSubject.next(false);
    //     this.attemptReconnect();
    //   };

    //   this.socket.onerror = (error) => {
    //     console.error('WebSocket error:', error);
    //     this.connectionSubject.next(false);
    //   };

    // } catch (error) {
    //   console.error('Error creating WebSocket connection:', error);
    //   this.connectionSubject.next(false);
    //   this.attemptReconnect();
    // }
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'activity':
        const activity: Activity = this.transformActivity(data.payload);
        activity.isNew = true;
        this.newActivitySubject.next(activity);
        this.showBrowserNotification(activity);
        break;
        
      case 'stats':
        if (data.payload.connectedClients !== undefined) {
          this.connectedClientsSubject.next(data.payload.connectedClients);
        }
        break;
        
      case 'pong':
        console.log('Received pong from server');
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    // COMMENTED: WebSocket disconnect disabled
    console.log('SimpleWebSocketService: WebSocket disconnect disabled');
    this.connectionSubject.next(false);
    
    // if (this.socket) {
    //   this.socket.close();
    //   this.socket = null;
    // }
    // this.connectionSubject.next(false);
  }

  send(message: any): void {
    // COMMENTED: WebSocket send disabled
    console.log('SimpleWebSocketService: WebSocket send disabled');
    
    // if (this.socket && this.socket.readyState === WebSocket.OPEN) {
    //   this.socket.send(JSON.stringify(message));
    // } else {
    //   console.warn('WebSocket is not connected');
    // }
  }

  sendActivity(activity: Partial<Activity>): void {
    this.send({
      type: 'activity',
      payload: activity
    });
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
        badge: '/assets/icons/checkscam-badge.png',
        tag: 'checkscam-activity',
        renotify: true,
        requireInteraction: false,
        silent: false
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