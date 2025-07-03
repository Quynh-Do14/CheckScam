import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SubjectDetailService, SubjectDetail } from '../../services/subject-detail.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, HttpClientModule],
  templateUrl: './subject-detail.component.html',
  styleUrls: ['./subject-detail.component.scss']
})
export class SubjectDetailComponent implements OnInit {
  subjectDetail: SubjectDetail | null = null;
  isLoading = true;
  error: string | null = null;
  imageErrors: Set<string> = new Set(); // Track failed images
  selectedImage: string | null = null; // For lightbox

  constructor(
    public route: ActivatedRoute, // Thay đổi thành public để có thể access trong template
    private router: Router,
    private subjectDetailService: SubjectDetailService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const subjectId = params['id'];
      
      // Lấy type từ query parameter hoặc tự động xác định
      this.route.queryParams.subscribe(queryParams => {
        const typeFromQuery = queryParams['type'];
        this.loadSubjectDetail(subjectId, typeFromQuery);
      });
    });
  }

  loadSubjectDetail(id: string, typeFromQuery?: string) {
    this.isLoading = true;
    this.error = null;

    // Sử dụng type từ query parameter hoặc tự động xác định
    const type = typeFromQuery ? parseInt(typeFromQuery) : this.determineSubjectType(id);
    
    this.subjectDetailService.getSubjectDetail(id, type).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.subjectDetail = response.data;
          
          // Process image URLs
          if (this.subjectDetail.evidenceImages) {
            this.subjectDetail.evidenceImages = this.subjectDetail.evidenceImages
              .map(url => this.sanitizeImageUrl(url))
              .filter(url => url !== null) as string[];
          }
          // Tăng view count khi load thành công
          this.incrementViewCount(id, type);
        } else {
          this.error = 'Không tìm thấy thông tin chi tiết cho đối tượng này.';
        }
        this.isLoading = false;
      },
      error: (error) => {

        this.error = 'Không thể tải thông tin chi tiết. Vui lòng thử lại sau.';
        this.isLoading = false;
      }
    });
  }
  
  private determineSubjectType(info: string): number {
    // Phone number (starts with 0 and has 10 digits)
    if (/^0\d{9}$/.test(info)) {
      return 1;
    }
    // Bank account (only digits)
    if (/^\d+$/.test(info)) {
      return 2;
    }
    // URL (contains domain pattern)
    if (/\.[a-z]{2,}/.test(info.toLowerCase())) {
      return 3;
    }
    // Default to phone
    return 1;
  }

  getTypeText(type: number): string {
    switch (type) {
      case 1: return 'Số điện thoại';
      case 2: return 'Tài khoản ngân hàng';
      case 3: return 'Website';
      default: return 'Không xác định';
    }
  }

  getTypeIcon(type: number): string {
    switch (type) {
      case 1: return 'fas fa-mobile-alt';
      case 2: return 'fas fa-university';
      case 3: return 'fas fa-globe';
      default: return 'fas fa-question';
    }
  }

  getRiskColor(risk: string): string {
    switch (risk) {
      case 'high': return '#dc2626';
      case 'medium': return '#ea580c';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  }

  getRiskText(risk: string): string {
    switch (risk) {
      case 'high': return 'Nguy hiểm cao';
      case 'medium': return 'Cảnh báo';
      case 'low': return 'Cảnh báo'; // Đổi từ "An toàn" thành "Cảnh báo"
      default: return 'Chưa xác định';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack() {
    window.history.back();
  }

  reportFalseInfo() {
    this.router.navigate(['/report/mistake'], {
      queryParams: { subjectInfo: this.subjectDetail?.info }
    });
  }

  // Sanitize and fix image URLs
  private sanitizeImageUrl(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Clean the URL
    url = url.trim();

    try {
      // If it's a relative path, convert to absolute
      if (url.startsWith('/uploads/')) {
        // Đường dẫn từ DB dạng /uploads/filename.jpg
        url = `http://localhost:8080${url}`;
      } else if (url.startsWith('uploads/')) {
        // Đường dẫn từ DB dạng uploads/filename.jpg
        url = `http://localhost:8080/${url}`;
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Nếu chỉ là tên file
        url = `http://localhost:8080/uploads/${url}`;
      }

      return url;
    } catch (e) {
      return null;
    }
  }

  // Handle image load errors
  onImageError(imageUrl: string, event: any) {

    this.imageErrors.add(imageUrl);
    
    const img = event.target;
    
    // Lấy tên file gốc từ URL
    const fileName = imageUrl.split('/').pop();
    if (!fileName) {
      img.style.display = 'none';
      return;
    }
    
    // Thử decode URI nếu có kí tự đặc biệt
    try {
      const decodedFileName = decodeURIComponent(fileName);
      const alternativeUrl = `http://localhost:8080/uploads/${decodedFileName}`;
      
      if (!this.imageErrors.has(alternativeUrl)) {

        img.src = alternativeUrl;
        return;
      }
    } catch (e) {

    }
    
    // Thử với encoding khác
    try {
      const cleanFileName = fileName.replace(/%20/g, ' ');
      const encodedFileName = encodeURIComponent(cleanFileName);
      const encodedUrl = `http://localhost:8080/uploads/${encodedFileName}`;
      
      if (!this.imageErrors.has(encodedUrl)) {

        img.src = encodedUrl;
        return;
      }
    } catch (e) {

    }
    
    // Nếu tất cả đều fail, ẩn ảnh
    img.style.display = 'none';
    img.parentElement.style.display = 'none';
  }

  // Check if image has error
  hasImageError(imageUrl: string): boolean {
    return this.imageErrors.has(imageUrl);
  }

  // Track by function for ngFor
  trackByImageUrl(index: number, image: string): string {
    return image;
  }

  // Handle successful image load
  onImageLoad(imageUrl: string) {

    // Remove from error set if it was there
    this.imageErrors.delete(imageUrl);
  }

  // Lightbox functions
  openLightbox(imageUrl: string) {
    this.selectedImage = imageUrl;
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
    
    // Auto focus on lightbox overlay for keyboard navigation
    setTimeout(() => {
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement;
      if (overlay) {
        overlay.focus();
      }
    }, 100);
  }

  closeLightbox() {
    this.selectedImage = null;
    // Restore body scroll
    document.body.style.overflow = 'auto';
  }

  getCurrentImageIndex(): number {
    if (!this.selectedImage || !this.subjectDetail?.evidenceImages) {
      return 0;
    }
    return this.subjectDetail.evidenceImages.indexOf(this.selectedImage);
  }

  // Navigation functions for lightbox
  goToPreviousImage() {
    if (!this.subjectDetail?.evidenceImages || this.subjectDetail.evidenceImages.length <= 1) {
      return;
    }
    
    const currentIndex = this.getCurrentImageIndex();
    const previousIndex = currentIndex === 0 ? this.subjectDetail.evidenceImages.length - 1 : currentIndex - 1;
    this.selectedImage = this.subjectDetail.evidenceImages[previousIndex];
  }

  goToNextImage() {
    if (!this.subjectDetail?.evidenceImages || this.subjectDetail.evidenceImages.length <= 1) {
      return;
    }
    
    const currentIndex = this.getCurrentImageIndex();
    const nextIndex = currentIndex === this.subjectDetail.evidenceImages.length - 1 ? 0 : currentIndex + 1;
    this.selectedImage = this.subjectDetail.evidenceImages[nextIndex];
  }

  // Handle keyboard navigation
  onLightboxKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape':
        this.closeLightbox();
        break;
      case 'ArrowLeft':
        this.goToPreviousImage();
        break;
      case 'ArrowRight':
        this.goToNextImage();
        break;
    }
  }

  // Tăng view count cho subject
  private incrementViewCount(info: string, type: number) {
    // Gọi API tăng view count
    this.subjectDetailService.incrementViewCount(info, type).subscribe({
      next: (response) => {

      },
      error: (error) => {

        // Không hiển thị lỗi cho user vì đây không phải là tính năng quan trọng
      }
    });
  }


}