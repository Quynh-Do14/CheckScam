import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, switchMap, filter } from 'rxjs';
import { NotificationDto, NotificationSummaryDto } from '../dtos/notification.dto';
import { environment } from '../environments/environment';
import { UserStateService } from './user-state.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/api/notifications`;
  
  // State management
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  private showNotificationUISubject = new BehaviorSubject<boolean>(false);
  
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public showNotificationUI$ = this.showNotificationUISubject.asObservable();

  constructor(
    private http: HttpClient,
    private userStateService: UserStateService
  ) {
    this.initializePolling();
  }

  private initializePolling() {
    // DISABLED NOTIFICATION POLLING
    /*
    // Poll for notifications every 30 seconds when user is logged in
    this.userStateService.user$.pipe(
      filter(user => !!user),
      switchMap(() => interval(30000)) // 30 seconds
    ).subscribe(() => {
      this.fetchNotifications();
    });

    // Initial fetch when user logs in
    this.userStateService.user$.pipe(
      filter(user => !!user)
    ).subscribe(() => {
      this.fetchNotifications();
    });
    */
  }

  fetchNotifications(): void {
    // DISABLED NOTIFICATION FETCHING
    /*
    this.http.get<{ message: string; status: string; data: NotificationSummaryDto }>(`${this.apiUrl}/summary`)
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.unreadCountSubject.next(response.data.totalUnread);
            this.notificationsSubject.next(response.data.recentNotifications);
          }
        },
        error: (error) => {
          console.error('Error fetching notifications:', error);
          // Set empty state when API fails
          this.unreadCountSubject.next(0);
          this.notificationsSubject.next([]);
        }
      });
      */
  }

  getAllNotifications(page: number = 0, size: number = 20): Observable<{ message: string; status: string; data: { content: NotificationDto[], totalElements: number } }> {
    return this.http.get<{ message: string; status: string; data: { content: NotificationDto[], totalElements: number } }>
      (`${this.apiUrl}?page=${page}&size=${size}`);
  }

  markAsRead(notificationId: string): Observable<{ message: string; status: string; data?: any }> {
    return this.http.put<{ message: string; status: string; data?: any }>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<{ message: string; status: string; data?: any }> {
    return this.http.put<{ message: string; status: string; data?: any }>(`${this.apiUrl}/read-all`, {});
  }

  deleteNotification(notificationId: string): Observable<{ message: string; status: string; data?: any }> {
    return this.http.delete<{ message: string; status: string; data?: any }>(`${this.apiUrl}/${notificationId}`);
  }

  // UI state management
  showNotificationPanel(): void {
    this.showNotificationUISubject.next(true);
  }

  hideNotificationPanel(): void {
    this.showNotificationUISubject.next(false);
  }

  toggleNotificationPanel(): void {
    this.showNotificationUISubject.next(!this.showNotificationUISubject.value);
  }

  // Show toast notification for real-time updates
  showToastNotification(notification: NotificationDto): void {
    // Create and show toast notification
    this.createToast(notification);
    
    // Update unread count
    const currentCount = this.unreadCountSubject.value;
    this.unreadCountSubject.next(currentCount + 1);
    
    // Add to notifications list
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...currentNotifications.slice(0, 9)]); // Keep only 10 recent
  }

  private createToast(notification: NotificationDto): void {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-avatar">
          ${notification.actorAvatar ? 
            `<img src="${notification.actorAvatar}" alt="${notification.actorName}">` :
            `<i class="bi bi-person-circle"></i>`
          }
        </div>
        <div class="toast-body">
          <div class="toast-title">${notification.title}</div>
          <div class="toast-message">${notification.message}</div>
        </div>
        <button class="toast-close">
          <i class="bi bi-x"></i>
        </button>
      </div>
    `;

    // Add styles
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-left: 4px solid #1877f2;
      z-index: 10000;
      min-width: 300px;
      max-width: 400px;
      animation: slideInRight 0.3s ease-out;
      cursor: pointer;
    `;

    // Add to body
    document.body.appendChild(toast);

    // Click to navigate
    toast.addEventListener('click', (e) => {
      if (!(e.target as Element).closest('.toast-close')) {
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
      }
    });

    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeToast(toast);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
      this.removeToast(toast);
    }, 5000);
  }

  private removeToast(toast: HTMLElement): void {
    toast.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // Get notification icon based on type
  getNotificationIcon(type: NotificationDto['type']): string {
    switch (type) {
      case 'LIKE_POST':
      case 'LIKE_COMMENT':
        return 'bi-heart-fill';
      case 'COMMENT':
      case 'REPLY':
        return 'bi-chat-dots-fill';
      case 'MENTION':
        return 'bi-at';
      default:
        return 'bi-bell-fill';
    }
  }

  // Get notification color based on type
  getNotificationColor(type: NotificationDto['type']): string {
    switch (type) {
      case 'LIKE_POST':
      case 'LIKE_COMMENT':
        return '#e91e63';
      case 'COMMENT':
      case 'REPLY':
        return '#1877f2';
      case 'MENTION':
        return '#ff9800';
      default:
        return '#6c757d';
    }
  }
}