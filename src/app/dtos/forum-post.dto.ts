export interface ForumPostDto {
  id: string | number;
  title: string;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];  // NEW: Support multiple images
  postType?: string;  // NEW: API includes postType field
  authorId: string | number;
  authorName: string;
  authorEmail: string;
  authorAvatarUrl?: string;
  createdAt: Date | string | null;
  updatedAt: Date | string;
  likesCount: number;
  commentsCount: number;
  viewCount?: number;  // NEW: API includes viewCount
  isLiked?: boolean;
  isPinned?: boolean;  // NEW: API includes isPinned
  comments?: any;      // NEW: API includes comments field
}

export interface CreateForumPostDto {
  title?: string;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];  // NEW: Support multiple images
}

export interface UpdateForumPostDto {
  title?: string;
  content?: string;
  imageUrl?: string;
  imageUrls?: string[];  // NEW: Support multiple images
}

export interface ForumCommentDto {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatarUrl?: string;
  parentCommentId?: string | null;
  replies?: ForumCommentDto[];
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  isLiked?: boolean;
  isAnonymous?: boolean;
}

export interface CreateForumCommentDto {
  postId: string;
  content: string;
  parentCommentId?: string | null;
  isAnonymous?: boolean;
}

export interface ForumLikeDto {
  id: string;
  postId?: string;
  commentId?: string;
  userId: string;
  createdAt: Date;
}

export interface UserForumProfileDto {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string;
  joinedDate: Date;
  postsCount: number;
  reportsCount: number;
  posts: ForumPostDto[];
  reports: any[]; // Sẽ import từ report.dto.ts
}
