export interface NotificationDto {
  id: string;
  type: 'LIKE_POST' | 'LIKE_COMMENT' | 'COMMENT' | 'REPLY' | 'MENTION';
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
  
  // Actor info (người thực hiện hành động)
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  
  // Target info (đối tượng bị tác động)
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  targetTitle?: string;
  targetContent?: string;
}

export interface CreateNotificationDto {
  recipientId: string;
  type: NotificationDto['type'];
  title: string;
  message: string;
  actionUrl?: string;
  actorId: string;
  targetType: NotificationDto['targetType'];
  targetId: string;
  targetTitle?: string;
  targetContent?: string;
}

export interface NotificationSummaryDto {
  totalUnread: number;
  recentNotifications: NotificationDto[];
}