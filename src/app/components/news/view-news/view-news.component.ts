import { CommonModule, Location } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NewsService } from '../../../services/news.service';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';  
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFacebookF } from '@fortawesome/free-brands-svg-icons';
import { faClock, faArrowLeft, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { environment } from '../../../environments/environment';

// Định nghĩa các interface để có kiểu dữ liệu mạnh mẽ hơn
interface AttachmentDto {
  id: number;
  url?: string | null;
}

interface Post {
  id: number;
  name: string;
  shortDescription: string;
  content: string;
  publishedDate?: string; 
  attachments?: AttachmentDto[];
  price?: string;
  downloads?: number;
  author?: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
  tag: string;
}

@Component({
  selector: 'app-view-news',
  standalone: true,                           
  imports: [
    CommonModule,                              
    HeaderComponent,
    FooterComponent,
    FontAwesomeModule,
    RouterModule
  ],
  templateUrl: './view-news.component.html',
  styleUrls: ['./view-news.component.scss']  
})
export class ViewNewsComponent implements OnInit {

  post: Post = {} as Post;
  attachmentDto: AttachmentDto[] = [];
  selectedImageUrl: string | null = null;
  currentUrl: string = '';
  relatedNews: Post[] = [];
  
  // Table of Contents
  tableOfContents: TocItem[] = [];
  showTableOfContents = false;
  
  // Like and Share functionality
  isLiked: boolean = false;
  likeCount: number = 0;

  readonly imageBaseUrl = `${environment.apiBaseUrl}/report/image/`;

  constructor(
    private newsService: NewsService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    library: FaIconLibrary
  ) {
    library.addIcons(faFacebookF, faClock, faArrowLeft, faEnvelope);
  }

  ngOnInit(): void {
    console.log('ViewNewsComponent ngOnInit');
    
    // Lắng nghe sự thay đổi của paramMap để tải lại nội dung
    this.route.paramMap.subscribe(params => {
      const param = params.get('id') || params.get('slug');
      console.log('URL param:', param);
      
      if (param) {
        // Kiểm tra nếu là số thì là ID, nếu không thì là slug
        if (this.isNumeric(param)) {
          const postId = Number(param);
          console.log('Loading news by ID:', postId);
          this.loadNewsById(postId);
        } else {
          console.log('Loading news by slug:', param);
          this.loadNewsBySlug(param);
        }
      }
    });

    this.currentUrl = window.location.href;
    this.loadRelatedNews();
    
    // Thêm scroll listener cho mục lục active highlighting
    this.addScrollListener();
  }

  /**
   * Kiểm tra chuỗi có phải là số không
   */
  private isNumeric(str: string): boolean {
    return !isNaN(Number(str)) && !isNaN(parseFloat(str));
  }

  /**
   * Tạo slug từ tiêu đề
   */
  private createSlug(title: string): string {
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

  /**
   * Lấy URL cho tin tức
   */
  getNewsUrl(news: any): string {
    const slug = this.createSlug(news.name);
    return `/list-news/${slug}`;
  }

  /**
   * Load news khi click từ related news
   */
  loadNewsByTitle(news: any): void {
    const slug = this.createSlug(news.name);
    this.router.navigate(['/list-news', slug]);
  }

  /**
   * Tải tin tức theo slug
   */
  loadNewsBySlug(slug: string): void {
    console.log('Searching for news with slug:', slug);
    
    // Tạm thời sử dụng getAllNews để tìm theo slug
    // Trong tương lai có thể tạo API riêng cho slug
    this.newsService.getAllNews(0, 1000).subscribe({
      next: (newsList: Post[]) => {
        console.log('Received news list:', newsList.length);
        
        // Tìm news có slug khớp
        const foundNews = newsList.find(news => {
          const newsSlug = this.createSlug(news.name);
          console.log('Comparing:', newsSlug, 'vs', slug);
          return newsSlug === slug;
        });
        
        if (foundNews) {
          console.log('Found news:', foundNews.name);
          this.post = foundNews;
          this.attachmentDto = foundNews.attachments ?? [];
          
          // Generate table of contents after content is loaded
          setTimeout(() => {
            this.generateTableOfContents();
          }, 100);
          
          // Cuộn lên đầu trang sau khi tải tin tức mới
          window.scrollTo(0, 0);
        } else {
          console.error('News not found with slug:', slug);
          alert('Không tìm thấy bài viết');
          this.router.navigate(['/list-news']);
        }
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách tin tức:', err);
        alert('Lỗi khi tải bài viết');
        this.router.navigate(['/list-news']);
      }
    });
  }

  /**
   * Kiểm tra tất cả heading đã có ID chưa
   */
  private verifyHeadingIds(): void {
    console.log('=== VERIFYING HEADING IDs ===');
    
    // Kiểm tra title
    const titleElement = document.querySelector('.news-title');
    console.log('Title element:', {
      found: !!titleElement,
      id: titleElement?.id,
      text: titleElement?.textContent?.trim()
    });
    
    // Kiểm tra tất cả heading trong content
    const contentElement = document.querySelector('.news-content');
    if (contentElement) {
      const allHeadings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
      console.log('All headings in content:');
      allHeadings.forEach((heading, index) => {
        const element = heading as HTMLElement;
        console.log(`  ${index}: ${element.tagName} - ID: "${element.id}" - Text: "${element.textContent?.trim()}"`);
      });
    }
    
    // Kiểm tra TOC items
    console.log('TOC items:');
    this.tableOfContents.forEach((item, index) => {
      const element = document.getElementById(item.id);
      console.log(`  ${index}: TOC ID "${item.id}" -> Element found: ${!!element}`);
    });
    
    console.log('=== END VERIFICATION ===');
  }

  /**
   * Generate table of contents from HTML content
   */
  private generateTableOfContents(): void {
    setTimeout(() => {
      const toc: TocItem[] = [];
      
      // Thêm tên bài đăng làm tiêu đề cấp 1 đầu tiên
      if (this.post && this.post.name) {
        toc.push({
          id: 'article-title',
          text: this.post.name,
          level: 1,
          tag: 'h1'
        });
        
        // Thêm ID cho tiêu đề bài viết nếu chưa có
        setTimeout(() => {
          const titleElement = document.querySelector('.news-title');
          if (titleElement && !titleElement.id) {
            (titleElement as HTMLElement).id = 'article-title';
          }
        }, 100);
      }
      
      const contentElement = document.querySelector('.news-content');
      
      if (contentElement) {
        const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
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
            
            // Điều chỉnh level: content headings sẽ bắt đầu từ level 2
            const originalLevel = parseInt(htmlElement.tagName.charAt(1));
            const adjustedLevel = originalLevel + 1; // h1 trong content thành level 2, h2 thành level 3...
            
            toc.push({
              id: htmlElement.id || id,
              text: text,
              level: adjustedLevel,
              tag: htmlElement.tagName.toLowerCase()
            });
          }
        });
      }
      
      this.tableOfContents = toc;
      this.showTableOfContents = toc.length > 0;
      
      // Xử lý text overflow sau khi render với animation
      setTimeout(() => {
        this.handleTextOverflow();
        this.addTocLoadAnimation(); // Thêm animation khi load xong
      }, 200);
    }, 500);
  }

  loadNewsById(id: number): void {
    this.newsService.getNewsById(id).subscribe({
      next: (res: Post) => {
        console.log('attachments from API', res.attachments);
        this.post = res;
        this.attachmentDto = res.attachments ?? [];
        
        // Generate table of contents after content is loaded
        setTimeout(() => {
          this.generateTableOfContents();
        }, 100);
        
        // Cuộn lên đầu trang sau khi tải tin tức mới
        window.scrollTo(0, 0); 
      },
      error: (err) => {
        alert(err?.error?.message || 'Lỗi khi tải bài viết');
        console.error('Lỗi khi tải bài viết:', err);
      }
    });
  }

  loadRelatedNews(): void {
    this.newsService.getAllNews(0, 5).subscribe({ 
      next: (res: Post[]) => {
        this.relatedNews = res.filter(newsItem => newsItem.id !== this.post.id);
        this.relatedNews = this.relatedNews.slice(0, 5);
      },
      error: (err) => {
        console.error('Lỗi khi tải tin tức liên quan:', err);
      }
    });
  }

  /* ---------- Helpers ---------- */

  getImageUrl(attachment: AttachmentDto): string {
    if (!attachment.url) {
      return 'assets/img/placeholder.png'; 
    }
    if (attachment.url.startsWith('http')) {
      return attachment.url;
    }

    const fileName = attachment.url.split('/').pop();
    return fileName ? `${this.imageBaseUrl}${encodeURIComponent(fileName)}` : 'assets/img/placeholder.png';
  }

  getImageUrlForRelated(newsItem: Post): string {
    if (newsItem.attachments && newsItem.attachments.length > 0) {
      const mainAttachment = newsItem.attachments[0];
      if (mainAttachment && mainAttachment.url) { 
        if (mainAttachment.url.startsWith('http')) {
          return mainAttachment.url;
        }
        const fileName = mainAttachment.url.split('/').pop();
        return fileName ? `${this.imageBaseUrl}${encodeURIComponent(fileName)}` : 'assets/img/placeholder.png';
      }
    }
    return 'assets/img/placeholder.png';
  }

  trackById(_: number, item: any): number { 
    return item.id;
  }

  trackByTocId(_: number, item: TocItem): string {
    return item.id;
  }

  getFileName(att: AttachmentDto): string {
    return att.url?.split('/').pop() ?? 'Đính kèm';
  }

  /* ---------- Navigation ---------- */
  goBackToList(): void {
    this.router.navigate(['/list-news']);
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

  @HostListener('window:keydown.escape')
  onEscKey(): void {
    if (this.selectedImageUrl) this.closeImage();
  }

  onImageError(ev: Event): void {
    (ev.target as HTMLImageElement).src = 'assets/img/error-placeholder.png';
  }

  /**
   * Thêm animation cho mục lục khi load xong
   */
  private addTocLoadAnimation(): void {
    const tocItems = document.querySelectorAll('.toc-item');
    tocItems.forEach((item, index) => {
      const element = item as HTMLElement;
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        element.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * 50);
    });
  }

  /**
   * Tạo ID duy nhất cho heading
   */
  private generateHeadingId(text: string, index: number): string {
    const slug = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    return `heading-${index}-${slug}`;
  }

  /**
   * Xử lý text overflow cho các link trong mục lục
   */
  private handleTextOverflow(): void {
    const tocLinks = document.querySelectorAll('.toc-link');
    
    tocLinks.forEach((link: Element) => {
      const linkElement = link as HTMLElement;
      const text = linkElement.textContent?.trim() || '';
      
      linkElement.title = text;
      
      if (text.length > 50 || linkElement.scrollHeight > linkElement.clientHeight) {
        linkElement.classList.add('text-overflow');
        
        if (text.length > 80) {
          const shortText = text.substring(0, 77) + '...';
          linkElement.setAttribute('data-full-text', text);
          linkElement.textContent = shortText;
        }
      }
    });
  }

  /**
   * Expand/collapse text on click for long headings
   */
  toggleTocItemText(event: Event): void {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const fullText = target.getAttribute('data-full-text');
    
    if (fullText) {
      const currentText = target.textContent || '';
      const isExpanded = currentText === fullText;
      
      if (isExpanded) {
        const shortText = fullText.substring(0, 77) + '...';
        target.textContent = shortText;
      } else {
        target.textContent = fullText;
      }
    }
  }

  /**
   * Cuộn đến heading được chọn trong mục lục
   */
  scrollToHeading(event: Event, headingId: string): void {
    // Ngăn chặn hành động mặc định để tránh conflict với routing
    event.preventDefault();
    event.stopPropagation();
    
    console.log('\n=== SCROLL TO HEADING ===' );
    console.log('Target heading ID:', headingId);
    
    let element = document.getElementById(headingId);
    console.log('Found element by ID:', !!element);
    
    // Nếu không tìm thấy bằng ID, thử tìm trong tất cả heading
    if (!element) {
      console.log('Element not found by ID, searching all headings...');
      
      // Tìm TOC item tương ứng
      const tocItem = this.tableOfContents.find(item => item.id === headingId);
      if (tocItem) {
        console.log('Found TOC item:', tocItem.text);
        
        // Tìm heading bằng text content
        const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .news-title');
        for (let i = 0; i < allHeadings.length; i++) {
          const heading = allHeadings[i] as HTMLElement;
          const headingText = heading.textContent?.trim();
          if (headingText === tocItem.text) {
            element = heading;
            // Thêm ID nếu chưa có
            if (!heading.id) {
              heading.id = headingId;
              console.log('Added ID to found heading');
            }
            break;
          }
        }
      }
    }
    
    if (element) {
      console.log('Scrolling to element:', element.tagName, element.textContent?.trim());
      console.log('Current scroll position BEFORE:', window.scrollY);
      
      // Bước 1: Tắt scroll-behavior tạm thời
      const originalScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      
      // Bước 2: Tính toán vị trí
      const headerOffset = 120;
      const targetPosition = element.offsetTop - headerOffset;
      
      console.log('Element offsetTop:', element.offsetTop);
      console.log('Target scroll position:', targetPosition);
      
      // Bước 3: Scroll cứng (instant)
      window.scrollTo(0, targetPosition);
      document.documentElement.scrollTop = targetPosition;
      document.body.scrollTop = targetPosition;
      
      // Bước 4: Kiểm tra sau 100ms
      setTimeout(() => {
        console.log('Current scroll position AFTER instant scroll:', window.scrollY);
        
        // Nếu vẫn chưa scroll được, thử force scroll
        if (Math.abs(window.scrollY - targetPosition) > 20) {
          console.log('Instant scroll failed, trying force methods');
          
          // Thử các phương pháp khác nhau
          document.documentElement.scrollTop = targetPosition;
          document.body.scrollTop = targetPosition;
          window.scroll(0, targetPosition);
          
          // Nếu là mobile, thử scroll trên body
          if (window.innerWidth <= 768) {
            document.querySelector('body')?.scrollTo(0, targetPosition);
          }
        }
        
        // Khôi phục scroll behavior
        document.documentElement.style.scrollBehavior = originalScrollBehavior;
        
        console.log('Final scroll position:', window.scrollY);
      }, 100);
      
      // Cập nhật active state
      setTimeout(() => {
        this.updateActiveTableOfContents();
      }, 300);
      
      console.log('Scroll initiated successfully');
    } else {
      console.error('Could not find heading with ID:', headingId);
      
      // Debug: Hiển thị tất cả heading hiện tại
      const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .news-title');
      console.log('All headings found:', allHeadings.length);
      allHeadings.forEach((heading, index) => {
        const element = heading as HTMLElement;
        console.log(`${index}: ${element.tagName || element.className} - ID: "${element.id}" - Text: "${element.textContent?.trim()}"`);
      });
    }
    
    console.log('=== END SCROLL TO HEADING ===\n');
  }
  
  /**
   * Tìm heading bằng text content
   */
  private findHeadingByText(headingId: string): HTMLElement | null {
    console.log('Searching for heading by text...');
    
    const tocItem = this.tableOfContents.find(item => item.id === headingId);
    if (!tocItem) {
      console.log('TOC item not found for ID:', headingId);
      return null;
    }
    
    console.log('Looking for text:', tocItem.text);
    
    // Tìm trong content trước
    const contentElement = document.querySelector('.news-content');
    if (contentElement) {
      const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i] as HTMLElement;
        const headingText = heading.textContent?.trim();
        if (headingText === tocItem.text) {
          console.log('Found heading by text:', heading);
          // Thêm ID nếu chưa có
          if (!heading.id) {
            heading.id = headingId;
            console.log('Added ID to heading');
          }
          return heading;
        }
      }
    }
    
    // Nếu là title
    if (headingId === 'article-title') {
      const titleElement = document.querySelector('.news-title') as HTMLElement;
      if (titleElement) {
        titleElement.id = 'article-title';
        console.log('Found and set title element');
        return titleElement;
      }
    }
    
    return null;
  }
  
  /**
   * Đảm bảo tất cả heading đều có ID
   */
  private ensureAllHeadingsHaveIds(): void {
    console.log('Ensuring all headings have IDs...');
    
    // Kiểm tra title
    const titleElement = document.querySelector('.news-title') as HTMLElement;
    if (titleElement && !titleElement.id) {
      titleElement.id = 'article-title';
      console.log('Added ID to title');
    }
    
    // Kiểm tra content headings
    const contentElement = document.querySelector('.news-content');
    if (contentElement) {
      const headings = contentElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach((heading, index) => {
        const element = heading as HTMLElement;
        if (!element.id) {
          const text = element.textContent?.trim() || '';
          const id = this.generateHeadingId(text, index);
          element.id = id;
          console.log(`Added ID "${id}" to heading:`, text);
        }
      });
    }
  }
  
  /**
   * Debug tất cả heading
   */
  private debugAllHeadings(): void {
    console.log('\n=== ALL HEADINGS DEBUG ===');
    
    const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .news-title');
    console.log('Total headings found:', allHeadings.length);
    
    allHeadings.forEach((heading, index) => {
      const element = heading as HTMLElement;
      console.log(`${index}: ${element.tagName || element.className} - ID: "${element.id}" - Text: "${element.textContent?.trim()}"`);
    });
    
    console.log('\nTOC items:');
    this.tableOfContents.forEach((item, index) => {
      console.log(`${index}: "${item.id}" -> "${item.text}"`);
    });
    
    console.log('=== END DEBUG ===\n');
  }

  /**
   * Navigate to news article
   */
  goToNews(id: number): void {
    this.router.navigate(['/view-news', id]);
  }

  /**
   * Toggle like status
   */
  toggleLike(): void {
    this.isLiked = !this.isLiked;
    this.likeCount += this.isLiked ? 1 : -1;
    
    console.log('Like toggled:', this.isLiked, 'Count:', this.likeCount);
  }

  /**
   * Share news article
   */
  shareNews(): void {
    const title = this.post.name || 'Chia sẻ bài viết';
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: title,
        url: url,
        text: this.post.shortDescription || 'Xem bài viết thú vị này!'
      }).catch(err => {
        console.log('Error sharing:', err);
        this.fallbackShare(title, url);
      });
    } else {
      this.fallbackShare(title, url);
    }
  }

  /**
   * Thêm scroll listener để highlight mục lục và xử lý cuối trang
   */
  private addScrollListener(): void {
    let throttleTimer: any;
    
    const scrollHandler = () => {
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
      
      throttleTimer = setTimeout(() => {
        this.updateActiveTableOfContents();
        this.handleStickyAtPageEnd();
      }, 16);
    };
    
    window.addEventListener('scroll', scrollHandler, { passive: true });
  }
  
  /**
   * Cập nhật active state cho mục lục dựa trên scroll position
   */
  private updateActiveTableOfContents(): void {
    if (!this.tableOfContents.length) return;
    
    const scrollPosition = window.scrollY + 150;
    let activeIndex = -1;
    
    for (let i = 0; i < this.tableOfContents.length; i++) {
      const element = document.getElementById(this.tableOfContents[i].id);
      if (element) {
        const elementTop = element.offsetTop;
        if (scrollPosition >= elementTop) {
          activeIndex = i;
        } else {
          break;
        }
      }
    }
    
    const tocLinks = document.querySelectorAll('.toc-link');
    tocLinks.forEach((link, index) => {
      link.classList.remove('active');
      if (index === activeIndex) {
        link.classList.add('active');
      }
    });
  }
  
  /**
   * Fallback share method
   */
  private fallbackShare(title: string, url: string): void {
    navigator.clipboard.writeText(url).then(() => {
      alert('Đã sao chép liên kết vào clipboard!');
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Đã sao chép liên kết vào clipboard!');
    });
  }

  /**
   * Handle sticky table of contents behavior at page end
   */
  private handleStickyAtPageEnd(): void {
    const tocElement = document.querySelector('.news-sidebar-right .sidebar-card') as HTMLElement;
    const relatedElement = document.querySelector('.news-sidebar-left .sidebar-card') as HTMLElement;
    
    const footer = document.querySelector('app-footer') as HTMLElement;
    if (!footer) return;
    
    const windowHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    
    const footerTop = footer.offsetTop;
    const isVeryNearFooter = scrollTop + windowHeight >= footerTop - 100;
    
    if (tocElement) {
      if (isVeryNearFooter) {
        const tocRect = tocElement.getBoundingClientRect();
        const tocBottom = tocRect.bottom;
        const footerRect = footer.getBoundingClientRect();
        const footerTop = footerRect.top;
        
        if (tocBottom > footerTop - 20) {
          const overlap = tocBottom - footerTop + 20;
          tocElement.style.transform = `translateY(-${overlap}px)`;
        } else {
          tocElement.style.transform = '';
        }
      } else {
        if (tocElement.style.transform) {
          tocElement.style.transform = '';
        }
      }
    }
    
    if (relatedElement) {
      if (isVeryNearFooter) {
        const relatedRect = relatedElement.getBoundingClientRect();
        const relatedBottom = relatedRect.bottom;
        const footerRect = footer.getBoundingClientRect();
        const footerTop = footerRect.top;
        
        if (relatedBottom > footerTop - 20) {
          const overlap = relatedBottom - footerTop + 20;
          relatedElement.style.transform = `translateY(-${overlap}px)`;
        } else {
          relatedElement.style.transform = '';
        }
      } else {
        if (relatedElement.style.transform) {
          relatedElement.style.transform = '';
        }
      }
    }
  }
}
