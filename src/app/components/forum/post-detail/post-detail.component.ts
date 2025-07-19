import { Component, OnInit, OnDestroy } from '@angular/core';
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
  ) {}

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
        next: (comments) => {
          this.comments = comments;
          this.commentsLoading = false;
        },
        error: (error) => {
          console.error('Error loading comments:', error);
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
      this.forumService.unlikePost(this.post.id) : 
      this.forumService.likePost(this.post.id);

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
        next: (comment) => {
          this.comments.push(comment);
          this.newComment.content = '';
          this.submittingComment = false;
          if (this.post) {
            this.post.commentsCount++;
          }
        },
        error: (error) => {
          console.error('Error creating comment:', error);
          this.submittingComment = false;
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

  onImageError(event: any) {
    event.target.src = 'assets/img/default-avatar.png';
  }

  goBack() {
    this.router.navigate(['/forum']);
  }
}
