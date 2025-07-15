import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ForumService } from '../../../services/forum.service';
import { ReportService } from '../../../services/report.service';
import { UserForumProfileDto, ForumPostDto } from '../../../dtos/forum-post.dto';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  userProfile: UserForumProfileDto | null = null;
  userPosts: ForumPostDto[] = [];
  userReports: any[] = [];
  loading = false;
  error = '';
  activeTab = 'posts'; // 'posts' | 'reports'
  currentPage = 1;
  totalPages = 0;
  limit = 10;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private forumService: ForumService,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserProfile() {
    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId) {
      this.router.navigate(['/forum']);
      return;
    }

    this.loading = true;
    this.error = '';

    this.forumService.getUserProfile(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.loading = false;
          this.loadUserPosts(userId);
          this.loadUserReports(userId);
        },
        error: (error) => {
          console.error('Error loading user profile:', error);
          this.error = 'Không thể tải thông tin người dùng. Vui lòng thử lại.';
          this.loading = false;
        }
      });
  }

  loadUserPosts(userId: string, page: number = 1) {
    this.forumService.getUserPosts(userId, page, this.limit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.userPosts = response.data;
          this.currentPage = page;
          this.totalPages = Math.ceil(response.total / this.limit);
        },
        error: (error) => {
          console.error('Error loading user posts:', error);
        }
      });
  }

  loadUserReports(userId: string) {
    // Assuming we have a method to get user reports
    // This would need to be implemented in the report service
    this.reportService.getUserReports(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reports) => {
          this.userReports = reports;
        },
        error: (error) => {
          console.error('Error loading user reports:', error);
        }
      });
  }

  switchTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'posts' && this.userProfile) {
      this.loadUserPosts(this.userProfile.userId);
    }
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages && this.userProfile) {
      this.loadUserPosts(this.userProfile.userId, page);
    }
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
