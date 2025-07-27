import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ForumService } from '../../../services/forum.service';
import { UserStateService } from '../../../services/user-state.service';
import { ForumPostDto, ForumCommentDto, CreateForumCommentDto } from '../../../dtos/forum-post.dto';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss']
})
export class PostDetailComponent implements OnInit, OnDestroy {
  @ViewChild('commentTextarea') commentTextarea!: ElementRef<HTMLTextAreaElement>;
  
  post: ForumPostDto | null = null;
  comments: ForumCommentDto[] = [];
  newComment: CreateForumCommentDto = {
    postId: '',
    content: ''
  };
  loading = false;
  commentsLoading = false;
  submittingComment = false;
  error = '';
  isLoggedIn = false;
  currentUser: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    private userStateService: UserStateService
  ) {
    // Ensure comments is always initialized as an empty array
    this.comments = [];
    console.log('PostDetailComponent: comments initialized as array:', Array.isArray(this.comments));
  }

  ngOnInit() {
    this.checkAuthStatus();
    this.loadPost();
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

  loadPost() {
    const postId = this.route.snapshot.paramMap.get('id');
    if (!postId) {
      this.router.navigate(['/forum']);
      return;
    }

    this.loading = true;
    this.error = '';
    this.newComment.postId = postId;

    this.forumService.getPostById(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (post) => {
          this.post = post;
          this.loading = false;
          this.loadComments(postId);
        },
        error: (error) => {
          console.error('Error loading post:', error);
          this.error = 'Không thể tải bài viết. Vui lòng thử lại.';
          this.loading = false;
        }
      });
  }

  loadComments(postId: string) {
    this.commentsLoading = true;
    
    this.forumService.getComments(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Load comments API response:', response);
          
          let comments: ForumCommentDto[] = [];
          
          // Handle both wrapped and direct array responses
          if (Array.isArray(response)) {
            // Direct array response
            comments = response;
            console.log('Using direct array format');
          } else if (response && (response as any).data && Array.isArray((response as any).data)) {
            // Wrapped response
            comments = (response as any).data;
            console.log('Using wrapped response format');
          } else {
            console.warn('Unexpected comments response format:', response);
            comments = [];
          }
          
          // Ensure comments is always an array
          this.comments = comments;
          this.commentsLoading = false;
          
          console.log('Comments loaded successfully:', this.comments.length, 'comments');
        },
        error: (error) => {
          console.error('Error loading comments:', error);
          this.comments = []; // Ensure it's still an array on error
          this.commentsLoading = false;
        }
      });
  }

  onLikePost() {
    if (!this.isLoggedIn || !this.post) {
      alert('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    const action = this.post.isLiked ? 
      this.forumService.unlikePost(this.post.id.toString()) : 
      this.forumService.likePost(this.post.id.toString());

    action.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        if (this.post) {
          this.post.isLiked = !this.post.isLiked;
          this.post.likesCount += this.post.isLiked ? 1 : -1;
        }
      },
      error: (error) => {
        console.error('Error liking post:', error);
      }
    });
  }

  onLikeComment(comment: ForumCommentDto) {
    if (!this.isLoggedIn) {
      alert('Vui lòng đăng nhập để thích bình luận');
      return;
    }

    const action = comment.isLiked ? 
      this.forumService.unlikeComment(comment.id) : 
      this.forumService.likeComment(comment.id);

    action.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        comment.isLiked = !comment.isLiked;
        comment.likesCount += comment.isLiked ? 1 : -1;
      },
      error: (error) => {
        console.error('Error liking comment:', error);
      }
    });
  }

  onSubmitComment() {
    if (!this.isLoggedIn) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }

    if (!this.newComment.content.trim()) {
      return;
    }

    this.submittingComment = true;

    this.forumService.createComment(this.newComment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Create comment API response:', response);
          
          // Extract comment data from wrapped response
          const comment = response.data;
          
          // Ensure comments is array before pushing
          if (!Array.isArray(this.comments)) {
            console.warn('this.comments is not an array, initializing...');
            this.comments = [];
          }
          
          this.comments.push(comment);
          this.newComment.content = '';
          this.submittingComment = false;
          
          if (this.post) {
            this.post.commentsCount++;
          }
          
          console.log('Comment added successfully:', comment);
        },
        error: (error) => {
          console.error('Error creating comment:', error);
          this.submittingComment = false;
          
          // Show error message to user
          alert('Không thể tạo bình luận. Vui lòng thử lại.');
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

  onImageError(event: any) {
    // Thay vì load default-avatar.png, hiển thị text hoặc ẩn ảnh
    event.target.style.display = 'none';
    // Hoặc thêm class CSS cho placeholder
    if (event.target.parentElement) {
      event.target.parentElement.classList.add('no-avatar');
    }
  }

  goBack() {
    this.router.navigate(['/forum']);
  }

  // Listen for ESC key globally
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    this.goBack();
  }

  // Auto-resize textarea
  onCommentInput(event: any) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  // Handle keyboard shortcuts
  onCommentKeydown(event: KeyboardEvent) {
    // Submit with Ctrl+Enter or Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.onSubmitComment();
    }
    
    // Close modal with Escape
    if (event.key === 'Escape') {
      this.goBack();
    }
  }

  // Placeholder methods for future features
  onEmojiClick() {
    // TODO: Implement emoji picker
    console.log('Emoji picker clicked');
  }

  onPhotoClick() {
    // TODO: Implement photo upload
    console.log('Photo upload clicked');
  }

  onGifClick() {
    // TODO: Implement GIF picker
    console.log('GIF picker clicked');
  }

  // Handle clicking outside modal to close
  onModalBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.goBack();
    }
  }

  // Focus comment input
  focusCommentInput() {
    if (this.commentTextarea) {
      this.commentTextarea.nativeElement.focus();
    }
  }
}
