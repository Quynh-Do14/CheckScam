// import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { Subject, takeUntil } from 'rxjs';
// import { NotificationService } from '../../services/notification.service';
// import { NotificationDto } from '../../dtos/notification.dto';

// @Component({
//   selector: 'app-notification',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './notification.component.html',
//   styleUrls: ['./notification.component.scss']
// })
// export class NotificationComponent implements OnInit, OnDestroy {
//   notifications: NotificationDto[] = [];
//   unreadCount = 0;
//   showPanel = false;
//   loading = false;

//   private destroy$ = new Subject<void>();

//   constructor(private notificationService: NotificationService) {}

//   ngOnInit() {
//     // Subscribe to notification updates
//     this.notificationService.notifications$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(notifications => {
//         this.notifications = notifications;
//       });

//     // Subscribe to unread count
//     this.notificationService.unreadCount$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(count => {
//         this.unreadCount = count;
//       });

//     // Subscribe to panel visibility
//     this.notificationService.showNotificationUI$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(show => {
//         this.showPanel = show;
//       });

//     // Initial fetch - DISABLED
//     // this.notificationService.fetchNotifications();
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   togglePanel() {
//     this.notificationService.toggleNotificationPanel();
//   }

//   closePanel() {
//     this.notificationService.hideNotificationPanel();
//   }

//   onNotificationClick(notification: NotificationDto) {
//     // Mark as read if unread
//     if (!notification.isRead) {
//       this.notificationService.markAsRead(notification.id).subscribe({
//         next: () => {
//           notification.isRead = true;
//           this.unreadCount = Math.max(0, this.unreadCount - 1);
//         }
//       });
//     }

//     // Navigate to action URL
//     if (notification.actionUrl) {
//       // Close panel and navigate
//       this.closePanel();
//       // Router navigation would be handled by routerLink in template
//     }
//   }

//   markAllAsRead() {
//     this.loading = true;
//     this.notificationService.markAllAsRead().subscribe({
//       next: () => {
//         this.notifications.forEach(n => n.isRead = true);
//         this.unreadCount = 0;
//         this.loading = false;
//       },
//       error: () => {
//         this.loading = false;
//       }
//     });
//   }

//   deleteNotification(notification: NotificationDto, event: Event) {
//     event.stopPropagation();
    
//     this.notificationService.deleteNotification(notification.id).subscribe({
//       next: () => {
//         this.notifications = this.notifications.filter(n => n.id !== notification.id);
//         if (!notification.isRead) {
//           this.unreadCount = Math.max(0, this.unreadCount - 1);
//         }
//       }
//     });
//   }

//   getTimeAgo(date: Date): string {
//     const now = new Date();
//     const targetDate = new Date(date);
//     const diffInMs = now.getTime() - targetDate.getTime();
//     const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
//     const diffInHours = Math.floor(diffInMinutes / 60);
//     const diffInDays = Math.floor(diffInHours / 24);

//     if (diffInMinutes < 1) return 'Vừa xong';
//     if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
//     if (diffInHours < 24) return `${diffInHours} giờ trước`;
//     if (diffInDays < 7) return `${diffInDays} ngày trước`;
//     return targetDate.toLocaleDateString('vi-VN');
//   }

//   getNotificationIcon(type: NotificationDto['type']): string {
//     return this.notificationService.getNotificationIcon(type);
//   }

//   getNotificationColor(type: NotificationDto['type']): string {
//     return this.notificationService.getNotificationColor(type);
//   }

//   trackByNotificationId(index: number, notification: NotificationDto): string {
//     return notification.id;
//   }

//   // Close panel when clicking outside
//   @HostListener('document:click', ['$event'])
//   onDocumentClick(event: Event) {
//     const target = event.target as Element;
//     if (!target.closest('.notification-container')) {
//       this.closePanel();
//     }
//   }
// }