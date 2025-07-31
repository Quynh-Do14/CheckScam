import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser'; // Import TitleService

import { NewsService } from '../../../services/news.service';
import { ShortService, Short } from '../../../services/short.service';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { ChatBoxComponent } from '../../chat-box/chat-box.component';
import { environment } from '../../../environments/environment';

interface AttachmentDto {
  id: number;
  url?: string | null;
}

@Component({
  selector: 'app-list-news',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    ChatBoxComponent,
  ],
  templateUrl: './list-news.component.html',
  styleUrls: ['./list-news.component.scss'],
})
export class ListNewsComponent implements OnInit {
  posts: any[] = [];
  pagedPosts: any[] = [];
  mainNewsList: any[] = [];
  regularNews: any[] = [];

  shorts: Short[] = [];
  loadingShorts = false;
  playingVideos: Set<number> = new Set();
  isDragging = false;
  startX = 0;
  scrollLeft = 0;
  lastX = 0;
  velocity = 0;
  lastTime = 0;
  momentumInterval: any = null;
  shortsPage = 0;
  shortsPageSize = 5;
  cardWidth = 220;
  cardGap = 20;
  isShortsTransitioning = false;
  slideOffset = 0;

  pageSize = 4;
  currentPage = 1;
  totalPosts = 0;
  totalPages = 0;
  pages: number[] = [];
  startIndex = 0;
  endIndex = 0;

  searchTerm = '';

  showChatbox = false;

  readonly imageBaseUrl = `${environment.apiBaseUrl}/news/image/`;

  isMobile = false;
  openShortModal(index: number) {
    this.router.navigate(['/list-short'], {
      queryParams: { index: index }
    });
  }

  constructor(
    private newsService: NewsService,
    private shortService: ShortService,
    private router: Router,
    private titleService: Title // Inject TitleService here
  ) {}

  ngOnInit(): void {
    // Set the page title here
    this.titleService.setTitle('Tin Tức AI6 - Săn Người Xấu, Diệt Kẻ Gian | Thông Tin Lừa Đảo Mới Nhất');

    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
    console.log('ListNewsComponent ngOnInit');
    this.loadShorts();
    this.loadMainNews();
    this.loadRegularNews();
  }

  get visibleShorts(): Short[] {
    return this.shorts.slice(this.shortsPage, this.shortsPage + this.shortsPageSize);
  }

  getCarouselCards(): Short[] {
    return this.visibleShorts;
  }

  canPrevShorts(): boolean {
    return this.shortsPage > 0;
  }
  canNextShorts(): boolean {
    return this.shortsPage + this.shortsPageSize < this.shorts.length;
  }

  prevShorts() {
    if (!this.canPrevShorts() || this.isShortsTransitioning) return;
    this.isShortsTransitioning = true;
    this.slideOffset = this.cardWidth + this.cardGap;
    setTimeout(() => {
      this.shortsPage--;
      this.slideOffset = 0;
      this.isShortsTransitioning = false;
    }, 700);
  }
  nextShorts() {
    if (!this.canNextShorts() || this.isShortsTransitioning) return;
    this.isShortsTransitioning = true;
    this.slideOffset = -(this.cardWidth + this.cardGap);
    setTimeout(() => {
      this.shortsPage++;
      this.slideOffset = 0;
      this.isShortsTransitioning = false;
    }, 700);
  }

  getSlideTransform(): string {
    return `translateX(${this.slideOffset}px)`;
  }

  loadShorts(): void {
    console.log('Loading shorts...');
    this.loadingShorts = true;
    this.shortService.getAllShorts().subscribe({
      next: (res) => {
        console.log('Shorts response:', res);
        console.log('🔥 Detailed shorts data:');
        res?.forEach((short, index) => {
          console.log(`🔥 Short ${index + 1}:`, {
            id: short.id,
            title: short.title,
            thumbnail: short.thumbnail,
            videoUrl: short.videoUrl,
            views: short.views
          });
        });
        // Debug first short thumbnail URL generation
        if (res && res.length > 0) {
          const firstShort = res[0];
          const thumbnailUrl = this.getShortThumbnailUrl(firstShort);
          console.log('🔥 First short thumbnail URL:', thumbnailUrl);
        }
        this.shorts = res || [];
        this.loadingShorts = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải shorts:', err);
        this.shorts = [];
        this.loadingShorts = false;
      },
    });
  }

  /**
   * Load 4 tin chính: 1 tin chính lớn + 3 tin chính nhỏ
   */
  loadMainNews(): void {
    console.log('Loading main news...');
    this.newsService.getMainNews().subscribe({
      next: (res) => {
        console.log('Main news response:', res);
        if (Array.isArray(res)) {
          this.mainNewsList = res.slice(0, 4);
        } else if (res) {
          this.mainNewsList = [res];
        } else {
          this.mainNewsList = [];
        }
        console.log('Main news list:', this.mainNewsList);
      },
      error: (err) => {
        console.error('Lỗi khi tải tin chính:', err);
        this.mainNewsList = [];
      },
    });
  }

  loadRegularNews(): void {
    console.log('Loading regular news...');
    this.newsService.getRegularNews().subscribe({
      next: (res) => {
        console.log('Regular news response:', res);
        this.regularNews = res || [];

        // Tin tức khác bắt đầu từ tin thứ 4 (bỏ 3 tin nhanh)
        this.posts = this.regularNews.slice(3);
        this.totalPosts = this.posts.length;
        this.calculateTotalPages();
        this.paginatePosts();
      },
      error: (err) => {
        console.error('Lỗi khi tải tin thường:', err);
        this.regularNews = [];
        this.posts = [];
        this.totalPosts = 0;
        this.calculateTotalPages();
        this.paginatePosts();
      },
    });
  }

  /* ===== Ảnh ===== */
  getImageUrl(attachment: AttachmentDto): string {
    if (!attachment?.url) return 'assets/img/placeholder.png';

    // Nếu đã là full URL
    if (attachment.url.startsWith('http')) {
      return attachment.url;
    }

    // Sử dụng NewsService để tạo URL chuẩn
    return this.newsService.getImageUrl(attachment.url);
  }

  // Helper cho tin tức không có attachment nhưng có ảnh trong content
  getNewsImageFromContent(news: any): string {
    if (!news?.content) return 'assets/img/placeholder.png';

    // Tìm ảnh đầu tiên trong content HTML
    const imgMatch = news.content.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch && imgMatch[1]) {
      const src = imgMatch[1];

      // Nếu là URL đầy đủ
      if (src.startsWith('http') || src.startsWith('/api/')) {
        return src.startsWith('http') ? src : `${environment.apiBaseUrl}${src}`;
      }
    }

    return 'assets/img/placeholder.png';
  }

  // Lấy ảnh hiển thị cho tin tức (uu tiên attachment, sau đó là content)
  getDisplayImage(news: any): string {
    // 1. Kiểm tra attachments trước
    if (news.attachments && news.attachments.length > 0) {
      const firstAttachment = news.attachments[0];
      return this.getImageUrl(firstAttachment);
    }

    // 2. Kiểm tra ảnh trong content
    return this.getNewsImageFromContent(news);
  }

  onImageError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    if (!img.src.includes('placeholder.png')) {
      img.src = 'assets/img/placeholder.png';
    }
  }

  /* ===== Tìm kiếm & phân trang ===== */
  searchPosts(): void {
    this.currentPage = 1;
    this.paginatePosts();
  }

  paginatePosts(): void {
    // Tin tức khác (bỏ 3 tin nhanh)
    const otherNews = this.regularNews.slice(3);
    const list = this.searchTerm
      ? otherNews.filter((p) =>
          p.name?.toLowerCase().includes(this.searchTerm.toLowerCase()),
        )
      : otherNews;

    this.totalPosts = list.length;
    this.calculateTotalPages();

    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.endIndex = Math.min(
      this.startIndex + this.pageSize - 1,
      this.totalPosts - 1,
    );

    this.pagedPosts = list.slice(this.startIndex, this.endIndex + 1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginatePosts();
    }
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalPosts / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  /* ===== trackBy ===== */
  trackById(_: number, item: any): number {
    return item?.id || Math.random();
  }

  /* ===== Getter cho template ===== */
  get mainNews(): any {
    return this.mainNewsList[0] || null;
  }

  get secondaryMainNews(): any[] {
    return this.mainNewsList.slice(1, 4);
  }

  get quickNews(): any[] {
    return this.regularNews.slice(0, 3);
  }

  onShortsTransitionEnd(): void {
    this.isShortsTransitioning = false;
    this.slideOffset = 0;
  }

  /* ===== Chat ===== */
  onAiTuVanClicked(): void {
    this.showChatbox = true;
  }

  closeChatbox(): void {
    this.showChatbox = false;
  }

  /* ===== Shorts ===== */
  getShortThumbnailUrl(short: Short): string {
    if (!short.thumbnail) {
      return 'assets/img/placeholder.png';
    }

    // If already a full URL
    if (short.thumbnail.startsWith('http')) {
      return short.thumbnail;
    }

    // Extract filename from path like "/uploads/images/filename.jpg"
    const filename = short.thumbnail.split('/').pop();
    if (!filename) {
      return 'assets/img/placeholder.png';
    }

    // Use ShortService to create standard URL
    const thumbnailUrl = this.shortService.getThumbnailUrl(filename);

    return thumbnailUrl;
  }

  getShortVideoUrl(short: Short): string {
    if (!short.videoUrl) return '';

    // If already a full URL
    if (short.videoUrl.startsWith('http')) {
      return short.videoUrl;
    }

    // Extract filename from path like "/uploads/videos/filename.mp4"
    const filename = short.videoUrl.split('/').pop();
    if (!filename) return '';

    // Use ShortService to create standard URL
    return this.shortService.getVideoUrl(filename);
  }

  isVideoPlaying(shortId?: number): boolean {
    return shortId !== undefined ? this.playingVideos.has(shortId) : false;
  }

  onShortClick(short: Short): void {
    console.log('🔥 Clicking on short:', short.title);

    if (!short.id) return;

    // Tìm index của short trong danh sách
    const shortIndex = this.shorts.findIndex(s => s.id === short.id);
    if (shortIndex !== -1) {
      // Chuyển sang trang list-short với index được chọn
      this.router.navigate(['/list-short'], {
        queryParams: { index: shortIndex }
      });
    }
  }

  onVideoEnded(shortId: number): void {
    // Remove from playing videos when video ends
    if (shortId !== undefined) {
      this.playingVideos.delete(shortId);
    }
  }

  onVideoPlay(short: Short): void {
    if (!short.id) return;
    // Đảm bảo chỉ tăng view 1 lần mỗi lần xem
    if (!(short as any)._viewed) {
      this.shortService.incrementViews(short.id).subscribe({
        next: (updatedShort) => {
          console.log('🔥 Video play - Views incremented:', updatedShort.views);
          // Cập nhật lại số view
          const index = this.shorts.findIndex(s => s.id === short.id);
          if (index !== -1) {
            this.shorts[index] = updatedShort;
          }
          (short as any)._viewed = true; // Đánh dấu đã xem
        },
        error: (err) => {
          console.error('Error incrementing views:', err);
        }
      });
    }
  }

  onShortImageError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    if (!img.src.includes('placeholder.png')) {
      img.src = 'assets/img/placeholder.png';
    }
  }

  /* ===== Drag to Scroll ===== */
  onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.startX = event.pageX - (event.target as HTMLElement).offsetLeft;
    this.scrollLeft = (event.target as HTMLElement).scrollLeft;
    this.lastX = event.pageX;
    this.lastTime = Date.now();
    (event.target as HTMLElement).style.cursor = 'grabbing';
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    const x = event.pageX - (event.target as HTMLElement).offsetLeft;
    const walk = (x - this.startX) * 2;
    (event.target as HTMLElement).scrollLeft = this.scrollLeft - walk;

    // Calculate velocity for momentum scrolling
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastTime;
    if (timeDiff > 0) {
      this.velocity = (event.pageX - this.lastX) / timeDiff;
    }
    this.lastX = event.pageX;
    this.lastTime = currentTime;
  }

  onMouseUp(event: MouseEvent): void {
    this.isDragging = false;
    const element = event.target as HTMLElement;
    element.style.cursor = 'grab';

    // Apply momentum scrolling based on velocity
    if (Math.abs(this.velocity) > 0.5) {
      this.applyMomentumScroll(element, this.velocity);
    }

    // Reset velocity
    this.velocity = 0;
    this.lastX = 0;
    this.lastTime = 0;
  }

  onMouseLeave(event: MouseEvent): void {
    this.isDragging = false;
    const element = event.target as HTMLElement;
    element.style.cursor = 'grab';

    // Apply momentum scrolling if velocity is significant
    if (Math.abs(this.velocity) > 0.5) {
      this.applyMomentumScroll(element, this.velocity);
    }

    // Reset velocity
    this.velocity = 0;
    this.lastX = 0;
    this.lastTime = 0;
  }

  applyMomentumScroll(element: HTMLElement, velocity: number): void {
    // Clear any existing momentum interval
    if (this.momentumInterval) {
      clearInterval(this.momentumInterval);
    }

    let currentVelocity = velocity * 15; // Amplify the velocity
    const friction = 0.95; // Friction factor

    this.momentumInterval = setInterval(() => {
      if (Math.abs(currentVelocity) < 0.1) {
        clearInterval(this.momentumInterval!);
        this.momentumInterval = null;
        return;
      }

      element.scrollLeft -= currentVelocity;
      currentVelocity *= friction;
    }, 16); // ~60fps
  }

  /* ===== Navigation ===== */
  createSlug(title: string): string {
    if (!title) return '';

    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '') // Chỉ giữ chữ, số, space, dấu gạch
      .trim()
      .replace(/\s+/g, '-') // Thay space bằng dấu gạch
      .replace(/-+/g, '-'); // Loại bỏ dấu gạch trùng lặp
  }

  getNewsUrl(news: any): string {
    const slug = this.createSlug(news.name);
    return `/list-news/${slug}`;
  }

  goToNewsDetail(news: any, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const slug = this.createSlug(news.name);
    console.log('🔥 Clicking on news image');
    console.log('🔥 Title:', news.name);
    console.log('🔥 Slug:', slug);
    console.log('🔥 Navigating to:', '/list-news/' + slug);
    this.router.navigate(['/list-news', slug]);
  }
}