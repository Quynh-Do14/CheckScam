import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ForumService } from '../../services/forum.service';
import { UserStateService } from '../../services/user-state.service';
import { ForumPostDto } from '../../dtos/forum-post.dto';
import { HeaderComponent } from '../header/header.component';
import { environment } from '../../environments/environment';

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
  ) {
    // Ensure posts is always initialized as an empty array
    this.posts = [];
  }

  ngOnInit() {
    console.log('ForumComponent initialized with API URL:', environment.apiUrl);
    this.checkAuthStatus();
    this.loadPosts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkAuthStatus() {
    console.log('ForumComponent: Checking auth status...');
    this.userStateService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        console.log('ForumComponent: User state changed:', user);
        this.isLoggedIn = !!user;
        this.currentUser = user;
        console.log('ForumComponent: isLoggedIn =', this.isLoggedIn);
      });
  }

  loadPosts() {
    this.loading = true;
    this.error = '';
    
    console.log('Loading posts from API...');
    this.forumService.getPosts(0, 10)  // Use page=0, size=10 to match API
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('Posts API response:', response);
          console.log('Response type:', typeof response);
          console.log('Response.data type:', typeof response?.data);
          console.log('Response.data.data type:', typeof response?.data?.data);
          console.log('Is response.data.data array?', Array.isArray(response?.data?.data));
          
          if (response?.data?.data) {
            console.log('Found posts in response.data.data:', response.data.data.length, 'posts');
            console.log('First post sample:', response.data.data[0]);
          }
          
          // Handle different response formats
          let posts: ForumPostDto[] = [];
          
          if (response?.data?.data && Array.isArray(response.data.data)) {
            // Actual API format: {data: {data: [...], total: X, page: 0}}
            posts = response.data.data;
            console.log('Using response.data.data format (correct API format)');
          } else if (response && Array.isArray(response.data)) {
            // Standard format: {data: [...], total: X}
            posts = response.data;
            console.log('Using response.data format');
          } else if (response && Array.isArray(response)) {
            // Direct array format: [...]
            posts = response;
            console.log('Using direct array format');
          } else if (response?.data && !Array.isArray(response.data) && (response.data as any).content) {
            // Spring Boot Pageable format: {data: {content: [...], totalElements: X}}
            posts = (response.data as any).content || [];
            console.log('Using Spring Boot pageable format');
          } else {
            console.warn('Unexpected posts response format:', response);
            posts = [];
          }
          
          // Ensure posts is always an array
          this.posts = Array.isArray(posts) ? posts : [];
          console.log('✅ Posts loaded successfully:', this.posts.length, 'posts');
          console.log('✅ Sample post:', this.posts[0]);
          console.log('✅ Posts array set to this.posts:', !!this.posts);
          
          // Scroll to top to show new posts (if any)
          if (this.posts.length > 0) {
            setTimeout(() => {
              const mainContent = document.querySelector('.main-content');
              if (mainContent) {
                mainContent.scrollTop = 0;
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }, 100);
          }
          
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading posts:', error);
          console.error('Error details:', {
            status: error?.status,
            message: error?.message,
            url: error?.url
          });
          
          this.posts = []; // Ensure posts is always an array
          this.error = 'Không thể tải bài viết. Vui lòng thử lại.';
          this.loading = false;
        }
      });
  }

  onShowCreatePost() {
    this.selectedPostType = null; // Không chọn loại bài viết mặc định
    this.showCreatePost = true;
  }

  async onCreatePost() {
    if (!this.newPostContent.trim()) return;
    
    // Check authentication first
    const token = localStorage.getItem('jwt_token');
    const user = this.userStateService.getCurrentUser();
    
    console.log('Creating post - Auth check:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      hasUser: !!user,
      userId: user?.id
    });
    
    if (!token) {
      this.error = 'Vui lòng đăng nhập để đăng bài viết';
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    try {
      console.log('Creating post via API...');
      
      let imageUrl = '';
      
      // Upload image if selected
      if (this.selectedFile) {
        console.log('Uploading image first...');
        const uploadResponse = await this.forumService.uploadImage(this.selectedFile).toPromise();
        console.log('Upload response:', uploadResponse);
        imageUrl = uploadResponse?.data?.imageUrl || '';
      }
      
      // Prepare post data
      const postData = {
        title: this.selectedPostType?.name,
        content: this.newPostContent,
        imageUrl: imageUrl
      };
      
      console.log('Creating post with data:', postData);
      
      // Create post via API
      const response = await this.forumService.createPost(postData).toPromise();
      console.log('Create post API response:', response);
      console.log('Response status:', response?.status);
      console.log('Response message:', response?.message);
      
      if (response && (response.status === 'CREATED' || response.status === 'OK') && response.data) {
        console.log('Post created successfully, reloading posts from server...');
        
        // Show success message
        this.error = '';
        const successMsg = 'Bài viết đã được đăng thành công! Đang tải lại...';
        console.log(successMsg);
        
        // Reset form first
        this.newPostContent = '';
        this.imagePreview = null;
        this.selectedFile = null;
        this.showCreatePost = false;
        this.selectedPostType = null;
        
        // Show temporary success message
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `<div style="background: #d4edda; color: #155724; padding: 12px; border-radius: 8px; margin: 10px 0; border: 1px solid #c3e6cb;">
          <i class="bi bi-check-circle-fill"></i> ${successMsg}
        </div>`;
        
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv && errorDiv.parentNode) {
          errorDiv.parentNode.insertBefore(tempDiv, errorDiv);
          setTimeout(() => {
            if (tempDiv.parentNode) {
              tempDiv.parentNode.removeChild(tempDiv);
            }
          }, 3000);
        }
        
        // Reload posts from server after a short delay
        setTimeout(() => {
          console.log('Reloading posts from server...');
          this.loadPosts();
        }, 800);
        
        console.log('Posts reload initiated');
      } else {
        console.warn('Invalid post response:', {
          hasResponse: !!response,
          status: response?.status,
          hasData: !!response?.data,
          fullResponse: response
        });
        this.error = 'Bài viết đã được tạo nhưng có lỗi hiển thị. Đang tải lại...';
        
        // Still try to reload posts in case it was actually created
        setTimeout(() => {
          console.log('Force reloading posts due to unclear response...');
          this.loadPosts();
        }, 1200);
      }
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      console.error('Error details:', {
        status: error?.status,
        message: error?.message,
        error: error?.error
      });
      
      if (error?.status === 401) {
        this.error = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      } else if (error?.status === 403) {
        this.error = 'Không có quyền thực hiện tác vụ này.';
      } else {
        this.error = 'Không thể tạo bài viết. Vui lòng thử lại.';
      }
      
      // Show error for 5 seconds
      setTimeout(() => {
        this.error = '';
      }, 5000);
    } finally {
      this.loading = false;
    }
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

    // Call API to like/unlike post
    const action = post.isLiked ? 
      this.forumService.unlikePost(post.id.toString()) : 
      this.forumService.likePost(post.id.toString());

    action.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        // Update UI after successful API call
        post.isLiked = !post.isLiked;
        post.likesCount += post.isLiked ? 1 : -1;
        console.log('Post like status updated:', post.id, 'isLiked:', post.isLiked);
      },
      error: (error) => {
        console.error('Error liking/unliking post:', error);
        alert('Không thể thực hiện thao tác. Vui lòng thử lại.');
      }
    });
  }

  getTimeAgo(date: Date | string | null): string {
    if (!date) return 'Không rõ';
    
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const diffInMs = now.getTime() - targetDate.getTime();
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
    // Thay vì load default-avatar.png, hiển thị text hoặc ẩn ảnh
    event.target.style.display = 'none';
    // Hoặc thêm class CSS cho placeholder
    if (event.target.parentElement) {
      event.target.parentElement.classList.add('no-avatar');
    }
  }

  getCurrentPlaceholder(): string {
    return this.selectedPostType?.placeholder || 'Chia sẻ bài viết của bạn...';
  }

  // TrackBy function for ngFor optimization and error prevention
  trackByPostId(index: number, post: ForumPostDto): string {
    return post?.id?.toString() || index.toString();
  }

  // Helper method to check if posts is a valid array
  isValidPostsArray(): boolean {
    return this.posts && Array.isArray(this.posts);
  }

  // Helper method to get proper avatar URL
  getAuthorAvatarUrl(avatarUrl: string | null | undefined): string {
    if (!avatarUrl) {
      // Trả về empty string thay vì default-avatar.png
      return '';
    }
    
    // If already full URL, return as is
    if (avatarUrl.startsWith('http')) {
      return avatarUrl;
    }
    
    // Build full URL with environment.apiUrl
    const cleanPath = avatarUrl.startsWith('/') ? avatarUrl.substring(1) : avatarUrl;
    return `${environment.apiUrl}/${cleanPath}`;
  }

  // Helper method to get proper image URL
  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return '';
    
    // If already full URL, return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Build full URL with environment.apiUrl
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    return `${environment.apiUrl}/${cleanPath}`;
  }
}
