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
import { ChatBoxComponent } from '../chat-box/chat-box.component';
import { Title } from '@angular/platform-browser'; // Import Title Service

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
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, ChatBoxComponent],
  templateUrl: './forum.component.html',
  styleUrls: ['./forum.component.scss']
})
export class ForumComponent implements OnInit, OnDestroy {
  posts: ForumPostDto[] = [];
  loading = false;
  newPostContent = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isLoggedIn = false;
  currentUser: any = null;
  showCreatePost = false;
  selectedPostType: PostType | null = { // Đặt mặc định là "Bóc phốt"
    id: 'bocphot',
    name: 'Bóc phốt',
    icon: 'bi-megaphone-fill',
    color: '#ff0000',
    placeholder: 'Bạn muốn bóc phốt đối tượng nào? Hãy nêu rõ thông tin và bằng chứng.'
  };

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
    },
    {
      id: 'bocphot', // Thêm loại bài viết "Bóc phốt"
      name: 'Bóc phốt',
      icon: 'bi-megaphone-fill', // Chọn icon phù hợp
      color: '#ff0000', // Màu đỏ nổi bật
      placeholder: 'Bạn muốn bóc phốt đối tượng nào? Hãy nêu rõ thông tin và bằng chứng.'
    }
  ];

  private destroy$ = new Subject<void>();
  showChatbox: boolean | undefined;

  constructor(
    private forumService: ForumService,
    private userStateService: UserStateService,
    private titleService: Title // Inject Title Service
  ) {
    this.posts = [];
  }

  ngOnInit() {
    this.titleService.setTitle('Bóc Phốt AI6 | Săn Người xấu, Diệt kẻ gian'); // Set the page title
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

    this.forumService.getPosts(0, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          let posts: ForumPostDto[] = [];

          if (response?.data?.data && Array.isArray(response.data.data)) {
            posts = response.data.data;
          } else if (response && Array.isArray(response.data)) {
            posts = response.data;
          } else if (response && Array.isArray(response)) {
            posts = response;
          } else if (response?.data && !Array.isArray(response.data) && (response.data as any).content) {
            posts = (response.data as any).content || [];
          } else {
            posts = [];
          }

          this.posts = Array.isArray(posts) ? posts : [];

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
          this.posts = [];
          this.loading = false;
        }
      });
  }

  onShowCreatePost() {
    // Khi mở modal, đặt placeholder mặc định cho loại "Bóc phốt"
    this.selectedPostType = this.postTypes.find(type => type.id === 'bocphot') || null;
    this.showCreatePost = true;
  }

  async onCreatePost() {
    if (!this.newPostContent.trim()) return;

    const token = localStorage.getItem('jwt_token');
    const user = this.userStateService.getCurrentUser();


    if (!token) {
      return;
    }

    this.loading = true;

    try {

      let imageUrl = '';

      if (this.selectedFile) {
        const uploadResponse = await this.forumService.uploadImage(this.selectedFile).toPromise();
        imageUrl = uploadResponse?.data?.imageUrl || '';
      }

      const postData = {
        // Sử dụng title của loại bài viết đã chọn, mặc định là "Bóc phốt"
        title: this.selectedPostType?.name || 'Bóc phốt',
        content: this.newPostContent,
        imageUrl: imageUrl
      };


      const response = await this.forumService.createPost(postData).toPromise();

      if (response && (response.status === 'CREATED' || response.status === 'OK') && response.data) {

        this.newPostContent = '';
        this.imagePreview = null;
        this.selectedFile = null;
        this.showCreatePost = false;
        this.selectedPostType = this.postTypes.find(type => type.id === 'bocphot') || null; // Reset về mặc định "Bóc phốt"


        setTimeout(() => {
          this.loadPosts();
        }, 800);
      } else {
        setTimeout(() => {
          this.loadPosts();
        }, 1200);
      }

    } catch (error: any) {
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

    const action = post.isLiked ?
      this.forumService.unlikePost(post.id.toString()) :
      this.forumService.likePost(post.id.toString());

    action.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        post.isLiked = !post.isLiked;
        post.likesCount += post.isLiked ? 1 : -1;
      },
      error: (error) => {
        alert('Không thể thực hiện thao tác. Vui lòng thử lại.');
      }
    });
  }

  getTimeAgo(date: Date | string | null): string {
    if (!date) return '';

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
    event.target.style.display = 'none';
    if (event.target.parentElement) {
      event.target.parentElement.classList.add('no-avatar');
    }
  }

  // Cập nhật placeholder dựa trên selectedPostType, mặc định là bóc phốt
  getCurrentPlaceholder(): string {
    return this.selectedPostType?.placeholder || 'Bạn muốn bóc phốt đối tượng nào? Hãy nêu rõ thông tin và bằng chứng.';
  }

  trackByPostId(index: number, post: ForumPostDto): string {
    return post?.id?.toString() || index.toString();
  }

  isValidPostsArray(): boolean {
    return this.posts && Array.isArray(this.posts);
  }

  getAuthorAvatarUrl(avatarUrl: string | null | undefined): string {
    if (!avatarUrl) {
      return '';
    }

    if (avatarUrl.startsWith('http')) {
      return avatarUrl;
    }

    const cleanPath = avatarUrl.startsWith('/') ? avatarUrl.substring(1) : avatarUrl;
    return `${environment.apiUrl}/${cleanPath}`;
  }

  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return '';

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    return `${environment.apiUrl}/${cleanPath}`;
  }

  formatPostContent(content: string): string {
    if (!content) return '';

    let formatted = content.replace(/\n/g, '<br>');

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');

    if (formatted.length > 300) {
      formatted = formatted.substring(0, 300) + '... <span class="read-more">Đọc thêm</span>';
    }

    return formatted;
  }

  getPostTypeLabel(postType: string): string {
    const labels: {[key: string]: string} = {
      'news': 'Tin tức',
      'warning': 'Cảnh báo',
      'tip': 'Mẹo hay',
      'question': 'Hỏi đáp',
      'discussion': 'Bóc phốt', // Giữ nguyên "Bóc phốt" cho loại 'discussion'
      'bocphot': 'Bóc phốt' // Thêm nhãn cho 'bocphot'
    };
    return labels[postType] || 'Drama';
  }

  onAiTuVanClicked(): void {
    debugger
    this.showChatbox = true;
  }

  closeChatbox(): void {
    this.showChatbox = false;
  }
}