import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { NewsService } from '../../../services/news.service';
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
  /* Tin tức */
  posts: any[] = [];
  pagedPosts: any[] = [];
  mainNewsList: any[] = []; // 4 tin chính (1 lớn + 3 nhỏ)
  regularNews: any[] = []; // Tin nhanh + tin khác

  /* Phân trang */
  pageSize = 4; // 4 tin mỗi trang
  currentPage = 1;
  totalPosts = 0;
  totalPages = 0;
  pages: number[] = [];
  startIndex = 0;
  endIndex = 0;

  /* Tìm kiếm */
  searchTerm = '';

  /* Chat */
  showChatbox = false;

  /* URL ảnh */
  readonly imageBaseUrl = `${environment.apiBaseUrl}/news/image/`;

  constructor(
    private newsService: NewsService,
    private router: Router,
  ) {}

  /* ===== Lifecycle ===== */
  ngOnInit(): void {
    console.log('ListNewsComponent ngOnInit');
    this.loadMainNews();
    this.loadRegularNews();
  }

  /* ===== API ===== */
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

  /* ===== Chat ===== */
  onAiTuVanClicked(): void {
    this.showChatbox = true;
  }

  closeChatbox(): void {
    this.showChatbox = false;
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
