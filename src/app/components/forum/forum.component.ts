import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ForumService } from '../../services/forum.service';
import { UserStateService } from '../../services/user-state.service';
import { ForumPostDto } from '../../dtos/forum-post.dto';
import { HeaderComponent } from '../header/header.component';

interface PostType {
  id: string;
  name: string;
  icon: string;
  color: string;
  placeholder: string;
}

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './forum.component.html',
  styleUrls: ['./forum.component.scss']
})
export class ForumComponent implements OnInit, OnDestroy {
  posts: ForumPostDto[] = [];
  loading = false;
  error = '';
  newPostContent = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isLoggedIn = false;
  currentUser: any = null;
  showCreatePost = false;
  selectedPostType: PostType | null = null;

  postTypes: PostType[] = [
    {
      id: 'news',
      name: 'Tin tức',
      icon: 'bi-newspaper',
      color: '#1877f2',
      placeholder: 'Chia sẻ tin tức mới về an toàn mạng, cập nhật chính sách bảo mật...'
    },
    {
      id: 'warning',
      name: 'Cảnh báo',
      icon: 'bi-exclamation-triangle-fill',
      color: '#ff6b6b',
      placeholder: 'Cảnh báo về thủ đoạn lừa đảo mới, website độc hại, phishing...'
    },
    {
      id: 'tip',
      name: 'Mẹo bảo mật',
      icon: 'bi-lightbulb-fill',
      color: '#28a745',
      placeholder: 'Chia sẻ kinh nghiệm, mẹo hay để bảo vệ thông tin cá nhân...'
    },
    {
      id: 'question',
      name: 'Hỏi đáp',
      icon: 'bi-question-circle-fill',
      color: '#6f42c1',
      placeholder: 'Đặt câu hỏi về vấn đề bảo mật, cần tư vấn...'
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private forumService: ForumService,
    private userStateService: UserStateService
  ) {}

  ngOnInit() {
    this.checkAuthStatus();
    this.loadPosts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkAuthStatus() {
    this.userStateService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        this.currentUser = user;
      });
  }

  loadPosts() {
    this.loading = true;
    this.error = '';
    
    this.forumService.getPosts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.posts = response.data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading posts:', error);
          this.error = 'Không thể tải bài viết. Vui lòng thử lại.';
          this.loading = false;
        }
      });
  }

  onShowCreatePost() {
    this.selectedPostType = this.postTypes[0]; // Default to first type
    this.showCreatePost = true;
  }

  onCreatePost() {
    if (!this.newPostContent.trim()) return;
    
    // Simulate creating post
    const newPost: ForumPostDto = {
      id: Date.now().toString(),
      title: this.selectedPostType?.name || '',
      content: this.newPostContent,
      imageUrl: this.imagePreview || undefined,
      authorId: this.currentUser?.id || 'current-user',
      authorName: this.currentUser?.name || 'Bạn',
      authorEmail: this.currentUser?.email || 'user@example.com',
      authorAvatarUrl: this.currentUser?.avatarUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      likesCount: 0,
      commentsCount: 0,
      isLiked: false
    };

    this.posts.unshift(newPost);
    this.newPostContent = '';
    this.imagePreview = null;
    this.selectedFile = null;
    this.showCreatePost = false;
    this.selectedPostType = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  onLikePost(post: ForumPostDto) {
    if (!this.isLoggedIn) {
      alert('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    post.isLiked = !post.isLiked;
    post.likesCount += post.isLiked ? 1 : -1;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút`;
    if (diffInHours < 24) return `${diffInHours} giờ`;
    return `${diffInDays} ngày`;
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

  onImageError(event: any) {
    event.target.src = 'assets/img/default-avatar.png';
  }

  getCurrentPlaceholder(): string {
    return this.selectedPostType?.placeholder || 'Chia sẻ tin tức, cảnh báo hoặc kinh nghiệm về an toàn mạng...';
  }
}
