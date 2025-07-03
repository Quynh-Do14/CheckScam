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

  // Sử dụng environment thay vì hardcode
  readonly imageBaseUrl = `${environment.apiBaseUrl}/report/image/`;

  constructor(
    private newsService: NewsService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id && !isNaN(id)) {
      this.loadNewsById(id);
    } else {
      this.error = 'ID bài viết không hợp lệ';
      this.isLoading = false;
    }
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
          setTimeout(() => this.processContentImages(), 100);
          setTimeout(() => this.processContentImages(), 300);
          setTimeout(() => this.processContentImages(), 500);
          
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
}
