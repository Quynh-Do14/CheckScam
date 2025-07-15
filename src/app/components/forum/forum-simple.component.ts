import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ForumServiceMock } from '../../services/forum-mock.service';
import { ForumPostDto } from '../../dtos/forum-post.dto';

@Component({
  selector: 'app-forum-simple',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="forum-container">
      <div class="forum-header">
        <h1>Diễn Đàn Cộng Đồng</h1>
        <p>Chia sẻ kinh nghiệm về an toàn mạng</p>
      </div>

      <div class="posts-container" *ngIf="!loading">
        <div class="post-card" *ngFor="let post of posts">
          <div class="post-header">
            <div class="author-info">
              <img 
                src="assets/img/default-avatar.png" 
                alt="Avatar"
                class="author-avatar">
              <div class="author-details">
                <h4 class="author-name">{{ getMaskedEmail(post.authorEmail) }}</h4>
                <span class="post-time">{{ getTimeAgo(post.createdAt) }}</span>
              </div>
            </div>
          </div>

          <div class="post-content">
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-excerpt">{{ post.content }}</p>
            
            <div class="post-image" *ngIf="post.imageUrl">
              <img [src]="post.imageUrl" [alt]="post.title" class="content-image">
            </div>
          </div>

          <div class="post-actions">
            <button class="action-btn like-btn" [class.liked]="post.isLiked">
              <i class="bi" [ngClass]="post.isLiked ? 'bi-heart-fill' : 'bi-heart'"></i>
              <span>{{ post.likesCount }}</span>
            </button>
            
            <button class="action-btn comment-btn">
              <i class="bi bi-chat"></i>
              <span>{{ post.commentsCount }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        Đang tải...
      </div>
    </div>
  `,
  styles: [`
    .forum-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
      min-height: 100vh;
    }

    .forum-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 40px 30px;
      margin-bottom: 30px;
      color: white;
      text-align: center;
    }

    .forum-header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .forum-header p {
      font-size: 1.1rem;
      margin: 0;
      opacity: 0.9;
    }

    .posts-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .post-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      padding: 24px;
      transition: all 0.3s ease;
    }

    .post-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    }

    .author-info {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    .author-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #e9ecef;
      margin-right: 12px;
    }

    .author-name {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 4px 0;
    }

    .post-time {
      font-size: 0.85rem;
      color: #6c757d;
    }

    .post-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 12px;
    }

    .post-excerpt {
      font-size: 1rem;
      color: #555;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .post-image {
      margin-top: 16px;
      border-radius: 12px;
      overflow: hidden;
    }

    .content-image {
      width: 100%;
      height: auto;
      max-height: 400px;
      object-fit: cover;
    }

    .post-actions {
      display: flex;
      align-items: center;
      gap: 20px;
      padding-top: 16px;
      border-top: 1px solid #e9ecef;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      padding: 8px 12px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.9rem;
      color: #6c757d;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    .like-btn.liked {
      color: #e91e63;
    }

    .loading {
      text-align: center;
      padding: 40px;
      font-size: 1.1rem;
      color: #6c757d;
    }

    @media (max-width: 768px) {
      .forum-container {
        padding: 15px;
      }
      
      .forum-header {
        padding: 30px 20px;
      }
      
      .forum-header h1 {
        font-size: 2rem;
      }
      
      .post-card {
        padding: 20px;
      }
    }
  `]
})
export class ForumSimpleComponent implements OnInit {
  posts: ForumPostDto[] = [];
  loading = true;

  constructor(private forumService: ForumServiceMock) {}

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.forumService.getPosts().subscribe({
      next: (response) => {
        this.posts = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.loading = false;
      }
    });
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return `${diffInDays} ngày trước`;
  }

  getMaskedEmail(email: string): string {
    if (!email || email.trim().length === 0) {
      return 'Unknown';
    }
    
    const [local] = email.split('@');
    const trimmedLocal = local.trim();
    
    if (trimmedLocal.length <= 4) {
      return trimmedLocal;
    }
    
    const totalLength = trimmedLocal.length;
    const hideCount = 3;
    
    const startHide = Math.floor((totalLength - hideCount) / 2);
    const endHide = startHide + hideCount;
    
    if (startHide < 1 || endHide >= totalLength) {
      return trimmedLocal;
    }
    
    const beforeHidden = trimmedLocal.substring(0, startHide);
    const afterHidden = trimmedLocal.substring(endHide);
    
    return beforeHidden + '***' + afterHidden;
  }
}
