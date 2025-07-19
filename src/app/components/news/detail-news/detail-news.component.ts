import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NewsService } from '../../../services/news.service';
import { environment } from '../../../environments/environment';

interface AttachmentDto {
  id: number;
  url?: string | null;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
  tag: string;
}

interface RelatedNews {
  id: number;
  name: string;
  shortDescription?: string;
  thumbnail?: string;
  createdAt?: string;
}


@Component({
  selector: 'app-detail-news',
  standalone: true,                           
  imports: [
    CommonModule
],
  templateUrl: './detail-news.component.html',
  styleUrls: ['./detail-news.component.scss']  
})
export class DetailNewsComponent implements OnInit, AfterViewInit {

  post: any = {};
  attachmentDto: AttachmentDto[] = [];
  selectedImageUrl: string | null = null;
  isLoading = true;
  error: string | null = null;
  
  // Safe HTML content for rich text display
  safeHtmlContent: SafeHtml = '';
  
  // Table of Contents
  tableOfContents: TocItem[] = [];
  showTableOfContents = false;
  
  // Related News
  relatedNews: RelatedNews[] = [];
  featuredNews: RelatedNews[] = [];

  // Sử dụng environment thay vì hardcode
  readonly imageBaseUrl = `${environment.apiBaseUrl}/report/image/`;

  constructor(
    private newsService: NewsService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    console.log('DetailNewsComponent ngOnInit');
    const id = Number(this.route.snapshot.paramMap.get('id'));
    console.log('News ID:', id);
    
    // Add test data for immediate display
    this.addTestData();
    
    if (id && !isNaN(id)) {
      this.loadNewsById(id);
      this.loadRelatedNews(id);
      this.loadFeaturedNews();
    } else {
      this.error = 'ID bài viết không hợp lệ';
      this.isLoading = false;
    }
  }

  /**
   * Add test data for immediate layout display
   */
  private addTestData(): void {
    // Test featured news
    this.featuredNews = [
      {
        id: 1,
        name: 'Đồ Án Tốt Nghiệp (9.5đ) - WebSite Bán Quần Áo Tích Hợp Chatbot AI',
        shortDescription: 'Website bán hàng hiệu quả và dễ dàng',
        thumbnail: 'assets/img/placeholder.jpg'
      },
      {
        id: 2,
        name: 'Báo Cáo Đồ Án Xây Dựng Website Mề và Bề',
        shortDescription: 'Hướng dẫn xây dựng website chuyên nghiệp',
        thumbnail: 'assets/img/placeholder.jpg'
      },
      {
        id: 3,
        name: 'XÂY DỰNG WEBSITE BÁN HÀNG CHO CỬA HÀNG THỜI TRANG',
        shortDescription: 'Giải pháp thương mại điện tử hiện đại',
        thumbnail: 'assets/img/placeholder.jpg'
      }
    ];
    
    // Test table of contents
    this.tableOfContents = [
      { id: 'heading-1', text: 'Giới thiệu', level: 1, tag: 'h1' },
      { id: 'heading-2', text: 'Tính năng chính', level: 2, tag: 'h2' },
      { id: 'heading-3', text: 'Cài đặt và sử dụng', level: 2, tag: 'h2' },
      { id: 'heading-4', text: 'Kết luận', level: 1, tag: 'h1' }
    ];
    this.showTableOfContents = true;
    
    console.log('Test data added - Featured news:', this.featuredNews.length);
    console.log('Test data added - TOC items:', this.tableOfContents.length);
  }

  private loadNewsById(id: number): void {
    this.isLoading = true;
    this.error = null;
    
    this.newsService.getNewsById(id).subscribe({
      next: (res) => {
        console.log('News data loaded:', res);
        this.post = res;
        this.attachmentDto = Array.isArray(res.attachments) ? res.attachments : [];
        
        // Sanitize HTML content for safe display
        if (res.content) {
          this.safeHtmlContent = this.sanitizer.bypassSecurityTrustHtml(res.content);
          // Process images after content is set - multiple attempts to ensure it works
          setTimeout(() => {
            this.processContentImages();
            this.generateTableOfContents();
          }, 100);
          setTimeout(() => {
            this.processContentImages();
            this.generateTableOfContents();
          }, 300);
          setTimeout(() => {
            this.processContentImages();
            this.generateTableOfContents();
          }, 500);
          
          // Set up mutation observer to catch dynamic content changes
          this.setupImageObserver();
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading news:', err);
        this.error = this.getErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  private getErrorMessage(err: any): string {
    if (err.status === 404) {
      return 'Bài viết không tồn tại';
    } else if (err.status === 500) {
      return 'Lỗi server, vui lòng thử lại sau';
    } else if (err.status === 0) {
      return 'Không thể kết nối đến server';
    }
    return err?.error?.message || 'Lỗi khi tải bài viết';
  }

  /* ---------- Helpers ---------- */

  getImageUrl({ url }: AttachmentDto): string {
    if (!url) return 'assets/img/placeholder.png';
    if (url.startsWith('http')) return url;

    const fileName = url.split('/').pop();
    return fileName ? `${this.imageBaseUrl}${encodeURIComponent(fileName)}` 
                    : 'assets/img/placeholder.png';
  }

  trackById(_: number, item: AttachmentDto): number {
    return item.id;
  }
  getFileName(att: AttachmentDto): string {
    return att.url?.split('/').pop() ?? 'Đính kèm';
  }

  /* ---------- Navigation ---------- */
  goBack(): void {
    this.router.navigate(['/news']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  /* ---------- Lightbox ---------- */
  openImage(url: string): void {
    this.selectedImageUrl = url;
    document.body.style.overflow = 'hidden';
  }

  closeImage(): void {
    this.selectedImageUrl = null;
    document.body.style.overflow = '';
  }

  onLightboxClick(event: Event): void {
    // Chỉ đóng khi click vào background, không phải ảnh
    if (event.target === event.currentTarget) {
      this.closeImage();
    }
  }

  @HostListener('window:keydown.escape')
  onEscKey(): void {
    if (this.selectedImageUrl) this.closeImage();
  }

  onImageError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    img.src = 'assets/img/placeholder.png';
  }

  onContentImageError(ev: Event): void {
    // Handle errors for images within content
    const img = ev.target as HTMLImageElement;
    img.style.display = 'none';
  }

  ngAfterViewInit(): void {
    // Ensure all images in content are properly styled
    this.processContentImages();
  }

  private processContentImages(): void {
    setTimeout(() => {
      const contentElement = document.querySelector('.news-content');
      if (contentElement) {
        const images = contentElement.querySelectorAll('img');
        images.forEach((img: HTMLImageElement) => {
          // Remove any existing styles that might override
          img.removeAttribute('style');
          img.removeAttribute('width');
          img.removeAttribute('height');
          
          // Force critical styles with !important via style attribute
          img.style.setProperty('max-width', '100%', 'important');
          img.style.setProperty('width', 'auto', 'important');
          img.style.setProperty('height', 'auto', 'important');
          img.style.setProperty('display', 'block', 'important');
          img.style.setProperty('margin', '1rem auto', 'important');
          img.style.setProperty('box-sizing', 'border-box', 'important');
          img.style.setProperty('object-fit', 'contain', 'important');
          
          // Additional styles for visual appeal
          img.style.borderRadius = '8px';
          img.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
          img.style.cursor = 'pointer';
          
          // Add click handler for lightbox
          img.onclick = () => this.openImage(img.src);
        });
        
        // Also ensure the container itself is properly constrained
        const wrapper = document.querySelector('.content-wrapper') as HTMLElement;
        if (wrapper) {
          wrapper.style.setProperty('width', '100%', 'important');
          wrapper.style.setProperty('max-width', '100%', 'important');
          wrapper.style.setProperty('overflow', 'hidden', 'important');
          wrapper.style.setProperty('box-sizing', 'border-box', 'important');
        }
        
        const newsContent = document.querySelector('.news-content') as HTMLElement;
        if (newsContent) {
          newsContent.style.setProperty('width', '100%', 'important');
          newsContent.style.setProperty('max-width', '100%', 'important');
          newsContent.style.setProperty('overflow', 'hidden', 'important');
          newsContent.style.setProperty('box-sizing', 'border-box', 'important');
        }
      }
    }, 100);
  }

  private setupImageObserver(): void {
    setTimeout(() => {
      const contentElement = document.querySelector('.news-content');
      if (contentElement) {
        const observer = new MutationObserver(() => {
          this.processContentImages();
        });
        
        observer.observe(contentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['src', 'style', 'width', 'height']
        });
      }
    }, 200);
  }

  // ================== Table of Contents Methods ==================

  /**
   * Tạo mục lục từ nội dung HTML
   */
  private generateTableOfContents(): void {
    console.log('Generating table of contents...');
    setTimeout(() => {
      const contentElement = document.querySelector('.news-content');
      console.log('Content element found:', !!contentElement);
      
      if (!contentElement) {
        this.tableOfContents = [];
        return;
      }
      
      const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
      console.log('Found headings:', headings.length);
      const toc: TocItem[] = [];
      
      headings.forEach((heading: Element, index: number) => {
        const htmlElement = heading as HTMLElement;
        const text = htmlElement.textContent?.trim() || '';
        if (text) {
          // Tạo ID duy nhất cho heading
          const id = this.generateHeadingId(text, index);
          
          // Thêm ID vào heading nếu chưa có
          if (!htmlElement.id) {
            htmlElement.id = id;
          }
          
          toc.push({
            id: htmlElement.id || id,
            text: text,
            level: parseInt(htmlElement.tagName.charAt(1)), // Lấy số từ h1, h2, etc.
            tag: htmlElement.tagName.toLowerCase()
          });
        }
      });
      
      this.tableOfContents = toc;
      this.showTableOfContents = toc.length > 0;
      console.log('Table of contents generated:', toc.length, 'items');
      console.log('Show TOC:', this.showTableOfContents);
    }, 100);
  }

  /**
   * Tạo ID duy nhất cho heading
   */
  private generateHeadingId(text: string, index: number): string {
    // Chuyển text thành slug
    const slug = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
      .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự đặc biệt
      .trim()
      .replace(/\s+/g, '-') // Thay space bằng dấu gạch ngang
      .replace(/-+/g, '-'); // Loại bỏ dấu gạch ngang thừa
    
    return `heading-${index}-${slug}`;
  }

  /**
   * Cuộn đến heading được chọn trong mục lục
   */
  scrollToHeading(headingId: string): void {
    const element = document.getElementById(headingId);
    if (element) {
      // Scroll with offset for fixed header
      const offsetTop = element.offsetTop - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      
      // Highlight heading temporarily
      element.style.backgroundColor = '#fff3cd';
      element.style.transition = 'background-color 0.3s ease';
      
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 2000);
    }
  }

  // ================== Related News Methods ==================

  /**
   * Load bài viết liên quan
   */
  private loadRelatedNews(currentId: number): void {
    this.newsService.getAllNewsForSidebar().subscribe({
      next: (res) => {
        // Lọc bỏ bài viết hiện tại và lấy 3 bài gần nhất
        this.relatedNews = res.data
          ?.filter((news: any) => news.id !== currentId)
          ?.slice(0, 3) || [];
      },
      error: (err) => {
        console.error('Error loading related news:', err);
        this.relatedNews = [];
      }
    });
  }

  /**
   * Load bài viết nổi bật
   */
  private loadFeaturedNews(): void {
    console.log('Loading featured news...');
    this.newsService.getAllNewsForSidebar().subscribe({
      next: (res) => {
        console.log('Featured news response:', res);
        // Lấy các bài viết nổi bật (có thể dựa trên isMain hoặc mới nhất)
        this.featuredNews = res.data
          ?.filter((news: any) => news.isMain || news.featured)
          ?.slice(0, 5) || res.data?.slice(0, 5) || [];
        console.log('Featured news loaded:', this.featuredNews.length);
      },
      error: (err) => {
        console.error('Error loading featured news:', err);
        this.featuredNews = [];
      }
    });
  }

  /**
   * Navigate to news article
   */
  goToNews(id: number): void {
    this.router.navigate(['/news', id]);
  }

  /**
   * Get thumbnail URL for news
   */
  getNewsThumbnail(news: RelatedNews): string {
    if (news.thumbnail) {
      return news.thumbnail.startsWith('http') 
        ? news.thumbnail 
        : `${this.imageBaseUrl}${news.thumbnail}`;
    }
    return 'assets/img/news-placeholder.jpg';
  }

  /**
   * Get additional attachments (exclude first one used as hero)
   */
  getAdditionalAttachments(): AttachmentDto[] {
    return this.attachmentDto?.slice(1) || [];
  }
}
