export interface ForumPostDto {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
}

export interface CreateForumPostDto {
  title: string;
  content: string;
  imageUrl?: string;
}

export interface UpdateForumPostDto {
  title?: string;
  content?: string;
  imageUrl?: string;
}

export interface ForumCommentDto {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  isLiked?: boolean;
}

export interface CreateForumCommentDto {
  postId: string;
  content: string;
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
