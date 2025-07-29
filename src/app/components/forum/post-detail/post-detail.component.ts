import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ForumService } from '../../../services/forum.service';
import { UserStateService } from '../../../services/user-state.service';
import { NotificationService } from '../../../services/notification.service';
import { ForumPostDto, ForumCommentDto, CreateForumCommentDto } from '../../../dtos/forum-post.dto';
import { environment } from '../../../environments/environment';

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
  isAnonymousComment = false;
  loading = false;
  commentsLoading = false;
  submittingComment = false;
  submittingReply = false;
  error = '';
  isLoggedIn = false;
  currentUser: any = null;
  replyingTo: string | null = null;
  replyContent = '';
  isAnonymousReply = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    private userStateService: UserStateService,
    private notificationService: NotificationService
  ) {
    // Ensure comments is always initialized as an empty array
    this.comments = [];
    console.log('PostDetailComponent: comments initialized as array:', Array.isArray(this.comments));
  }

  ngOnInit() {
    console.log('PostDetailComponent initialized');
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
    console.log('Loading post with ID:', postId);
    
    if (!postId) {
      console.error('No post ID found in route');
      this.router.navigate(['/forum']);
      return;
    }

    this.loading = true;
    this.error = '';
    this.newComment.postId = postId;

    console.log('Calling forumService.getPostById...');
    this.forumService.getPostById(postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (post) => {
          console.log('Post loaded successfully:', post);
          console.log('Post imageUrl:', post.imageUrl);
          console.log('Post object keys:', Object.keys(post));
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
    console.log('Submit comment clicked', {
      isLoggedIn: this.isLoggedIn,
      content: this.newComment.content,
      contentTrim: this.newComment.content.trim(),
      submittingComment: this.submittingComment
    });

    if (!this.isLoggedIn) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }

    if (!this.newComment.content.trim()) {
      console.log('No content to submit');
      return;
    }

    this.submittingComment = true;

    // Add anonymous flag to comment data
    const commentData: CreateForumCommentDto = {
      ...this.newComment,
      isAnonymous: this.isAnonymousComment
    };

    this.forumService.createComment(commentData)
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
          this.isAnonymousComment = false;
          this.submittingComment = false;
          
          if (this.post) {
            this.post.commentsCount++;
          }
          
          console.log('Comment added successfully:', comment);
          
          // Create notification for post author (if not commenting on own post)
          if (this.post && this.post.authorId !== this.currentUser?.id) {
            this.createCommentNotification(this.post, comment);
          }
          
          // Check for mentions in comment content
          this.checkForMentions(comment.content, comment);
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
    if (!date) return '';
    
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

  // Format comment/reply content to highlight mentions
  formatContentWithMentions(content: string): string {
    if (!content) return content;
    
    // Regex to match @mentions at the beginning of the content
    const mentionRegex = /^(@[^@\s]+)\s*/;
    const match = content.match(mentionRegex);
    
    if (match) {
      const mention = match[1];
      const restContent = content.substring(match[0].length);
      return `<span class="mention-text">${mention}</span> ${restContent}`;
    }
    
    return content;
  }

  onImageError(event: any) {
    console.error('Image failed to load:', event.target.src);
    console.error('Image error:', event);
    
    // Check if this is a post image or avatar
    if (event.target.classList.contains('post-image')) {
      // For post images, hide the entire media container
      const mediaContainer = event.target.closest('.post-media');
      if (mediaContainer) {
        mediaContainer.style.display = 'none';
      }
    } else {
      // For avatars, hide the image and show placeholder
      event.target.style.display = 'none';
      if (event.target.parentElement) {
        event.target.parentElement.classList.add('no-avatar');
      }
    }
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return '';
    
    // If URL is already absolute, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If URL is relative, prepend the API base URL
    return environment.apiUrl + url;
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

  // Reply functionality
  onReplyComment(comment: ForumCommentDto) {
    if (!this.isLoggedIn) {
      alert('Vui lòng đăng nhập để phản hồi bình luận');
      return;
    }

    this.replyingTo = comment.id;
    
    // Auto-mention the person being replied to (like Facebook)
    const authorName = comment.isAnonymous ? 'Người dùng ẩn danh' : 
                      (comment.authorName || this.getMaskedEmail(comment.authorEmail));
    this.replyContent = `@${authorName} `;
    
    // Focus on reply input after a short delay and position cursor at end
    setTimeout(() => {
      const replyInput = document.querySelector('.reply-input') as HTMLTextAreaElement;
      if (replyInput) {
        replyInput.focus();
        // Position cursor at the end of the mention
        replyInput.setSelectionRange(this.replyContent.length, this.replyContent.length);
      }
    }, 100);
  }

  cancelReply() {
    this.replyingTo = null;
    this.replyContent = '';
    this.isAnonymousReply = false;
  }

  submitReply(parentComment: ForumCommentDto) {
    if (!this.isLoggedIn || !this.replyContent.trim()) {
      return;
    }

    this.submittingReply = true;

    const replyData: CreateForumCommentDto = {
      postId: this.newComment.postId,
      content: this.replyContent,
      parentCommentId: parentComment.id, // Use direct parent for true nesting
      isAnonymous: this.isAnonymousReply
    };

    this.forumService.createComment(replyData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Create reply API response:', response);
          
          const reply = response.data;
          
          // Add reply directly to the parent comment
          if (!parentComment.replies) {
            parentComment.replies = [];
          }
          parentComment.replies.push(reply);
          
          // Update post comment count
          if (this.post) {
            this.post.commentsCount++;
          }
          
          // Reset reply form
          this.replyingTo = null;
          this.replyContent = '';
          this.isAnonymousReply = false;
          this.submittingReply = false;
          
          console.log('Reply added successfully:', reply);
          
          // Create notification for parent comment author (if not replying to own comment)
          if (parentComment.authorId !== this.currentUser?.id) {
            this.createReplyNotification(parentComment, reply);
          }
          
          // Check for mentions in reply content
          this.checkForMentions(reply.content, reply);
        },
        error: (error) => {
          console.error('Error creating reply:', error);
          this.submittingReply = false;
          alert('Không thể tạo phản hồi. Vui lòng thử lại.');
        }
      });
  }

  // Helper method to find root parent comment ID
  private findRootParentId(comment: ForumCommentDto): string {
    // If comment is already a root comment (no parent), return its ID
    if (!comment.parentCommentId) {
      return comment.id;
    }
    
    // Find the root parent by traversing up
    const rootComment = this.comments.find(c => c.id === comment.parentCommentId);
    return rootComment ? rootComment.id : comment.id;
  }

  // Helper method to find comment by ID in nested structure (recursive)
  private findCommentById(commentId: string): ForumCommentDto | null {
    // First check root comments
    const rootComment = this.comments.find(c => c.id === commentId);
    if (rootComment) {
      return rootComment;
    }

    // Recursively search in nested replies
    for (const comment of this.comments) {
      const found = this.findCommentInReplies(comment, commentId);
      if (found) {
        return found;
      }
    }

    return null;
  }

  // Helper method to recursively search in replies
  private findCommentInReplies(comment: ForumCommentDto, targetId: string): ForumCommentDto | null {
    if (!comment.replies) {
      return null;
    }

    // Check direct replies
    const directReply = comment.replies.find(r => r.id === targetId);
    if (directReply) {
      return directReply;
    }

    // Recursively check nested replies
    for (const reply of comment.replies) {
      const found = this.findCommentInReplies(reply, targetId);
      if (found) {
        return found;
      }
    }

    return null;
  }

  onReplyKeydown(event: KeyboardEvent) {
    // Submit with Ctrl+Enter or Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (this.replyingTo) {
        const parentComment = this.findCommentById(this.replyingTo);
        if (parentComment) {
          this.submitReply(parentComment);
        }
      }
    }
    
    // Cancel with Escape
    if (event.key === 'Escape') {
      this.cancelReply();
    }
  }

  onSharePost() {
    if (!this.post) return;

    const postUrl = window.location.href;
    const shareText = `${this.post.title || 'Bài bóc phốt hot'} - ${this.post.content.substring(0, 100)}...`;

    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: this.post.title || 'Bài bóc phốt hot',
        text: shareText,
        url: postUrl
      }).then(() => {
        console.log('Shared successfully');
      }).catch((error) => {
        console.log('Error sharing:', error);
        this.fallbackShare(postUrl);
      });
    } else {
      // Fallback to clipboard copy
      this.fallbackShare(postUrl);
    }
  }

  private fallbackShare(url: string) {
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      // Show success message
      alert('Link bài viết đã được sao chép!');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      // Fallback to prompt
      prompt('Sao chép link bài viết:', url);
    });
  }

  // Notification helper methods
  private createCommentNotification(post: ForumPostDto, comment: ForumCommentDto) {
    if (!this.currentUser || comment.isAnonymous) return;

    // // Create notification for post author
    // const notification = {
    //   type: 'COMMENT' as const,
    //   title: 'Bình luận mới',
    //   message: `${this.currentUser.name || this.currentUser.username} đã bình luận về bài viết của bạn: "${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}"`,
    //   actionUrl: `/forum/posts/${post.id}`,
    //   actorName: this.currentUser.name || this.currentUser.username || 'Người dùng',
    //   actorAvatar: this.currentUser.avatar
    // };

    // Show toast notification (in real app, this would be sent via WebSocket/SSE)
    // this.notificationService.showToastNotification({
    //   id: Math.random().toString(36),
    //   ...notification,
    //   actorId: this.currentUser.id?.toString() || '',
    //   targetType: 'POST',
    //   targetId: post.id.toString(),
    //   targetTitle: post.title,
    //   targetContent: post.content.substring(0, 100),
    //   isRead: false,
    //   createdAt: new Date()
    // });
  }

  private createReplyNotification(parentComment: ForumCommentDto, reply: ForumCommentDto) {
    if (!this.currentUser || reply.isAnonymous) return;

    // Create notification for parent comment author
    const notification = {
      type: 'REPLY' as const,
      title: 'Phản hồi bình luận',
      message: `${this.currentUser.name || this.currentUser.username} đã phản hồi bình luận của bạn: "${reply.content.substring(0, 50)}${reply.content.length > 50 ? '...' : ''}"`,
      actionUrl: `/forum/posts/${this.post?.id}`,
      actorName: this.currentUser.name || this.currentUser.username || 'Người dùng',
      actorAvatar: this.currentUser.avatar
    };

    // Show toast notification
    this.notificationService.showToastNotification({
      id: Math.random().toString(36),
      ...notification,
      actorId: this.currentUser.id?.toString() || '',
      targetType: 'COMMENT',
      targetId: parentComment.id,
      targetTitle: undefined,
      targetContent: parentComment.content.substring(0, 100),
      isRead: false,
      createdAt: new Date()
    });
  }

  private checkForMentions(content: string, comment: ForumCommentDto) {
    if (!this.currentUser || comment.isAnonymous) return;

    // Extract mentions from content using regex
    const mentionRegex = /@([^@\s]+)/g;
    const mentions = content.match(mentionRegex);

    if (mentions) {
      mentions.forEach(mention => {
        const mentionedName = mention.substring(1); // Remove @
        
        // Skip if mentioning self
        if (mentionedName === (this.currentUser?.name || this.currentUser?.username)) {
          return;
        }

        // Create mention notification
        const notification = {
          type: 'MENTION' as const,
          title: 'Nhắc đến bạn',
          message: `${this.currentUser.name || this.currentUser.username} đã nhắc đến bạn trong một bình luận: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          actionUrl: `/forum/posts/${this.post?.id}`,
          actorName: this.currentUser.name || this.currentUser.username || 'Người dùng',
          actorAvatar: this.currentUser.avatar
        };

        // Show toast notification
        this.notificationService.showToastNotification({
          id: Math.random().toString(36),
          ...notification,
          actorId: this.currentUser.id?.toString() || '',
          targetType: 'COMMENT',
          targetId: comment.id,
          targetTitle: undefined,
          targetContent: content.substring(0, 100),
          isRead: false,
          createdAt: new Date()
        });
      });
    }
  }
}
