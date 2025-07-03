import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { MistakeService } from '../../../services/mistake.service'; // Đảm bảo đường dẫn đúng
import { Mistake } from '../../../services/mistake.service'; // Import Mistake DTO

@Component({
  selector: 'app-mistake-detail',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './mistake-detail.component.html',
  styleUrls: ['./mistake-detail.component.scss'], // Sử dụng CSS mới
  providers: [DatePipe]
})
export class MistakeDetailComponent implements OnInit {
  mistakeId!: number;
  mistake: Mistake | null = null; // Sử dụng Mistake DTO
  loading: boolean = true;
  error: string | null = null;

  backendBaseUrl: string = 'http://localhost:8080'; // URL cơ sở của backend nơi ảnh được lưu trữ

  // === BIẾN MỚI CHO MODAL XEM ẢNH ===
  isImageModalOpen: boolean = false;
  currentImageIndex: number = 0;
  // ===================================

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mistakeService: MistakeService, // Sử dụng MistakeService
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.mistakeId = +idParam;
        this.getMistakeDetails();
      } else {
        this.error = 'ID khiếu nại không hợp lệ.';
        this.loading = false;
        this.toastr.error('ID khiếu nại không hợp lệ.', 'Lỗi');
      }
    });
  }

  getMistakeDetails(): void {
    this.loading = true;
    this.mistakeService.getMistakeById(this.mistakeId).subscribe( // Gọi service lấy chi tiết khiếu nại
      (data: Mistake) => {
        this.mistake = data;
        this.loading = false;
        console.log('Chi tiết khiếu nại:', this.mistake);
      },
      (err) => {
        this.error = 'Không thể tải chi tiết khiếu nại. Vui lòng thử lại sau.';
        this.loading = false;
        console.error('Lỗi khi tải chi tiết khiếu nại:', err);
        this.toastr.error('Không thể tải chi tiết khiếu nại. Vui lòng thử lại sau.', 'Lỗi');
      }
    );
  }

  // Phương thức để kết hợp base URL với đường dẫn ảnh tương đối
  getFullImageUrl(relativePath: string): string {
    if (!relativePath || typeof relativePath !== 'string') {
      return `${this.backendBaseUrl}/assets/placeholder-image.jpg`; // Ảnh placeholder
    }

    let fullUrl = relativePath.trim();

    // Nếu đường dẫn đã là URL đầy đủ (có http/https), sử dụng trực tiếp
    if (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) {
      return fullUrl;
    }

    // Xử lý các trường hợp đường dẫn tương đối
    // Dựa vào cấu trúc ảnh bạn cung cấp: "ddb0696b-ec3e-4453-92fa-4f18bc7d5a45_a2.jpeg"
    // Giả định backend trả về tên file và bạn cần thêm /uploads/
    if (fullUrl.startsWith('/uploads/')) {
      fullUrl = `${this.backendBaseUrl}${fullUrl}`;
    } else if (fullUrl.startsWith('uploads/')) {
      fullUrl = `${this.backendBaseUrl}/${fullUrl}`;
    } else {
      // Giả định đây là tên file và cần thêm /uploads/
      fullUrl = `${this.backendBaseUrl}/uploads/${fullUrl}`;
    }

    // Xử lý mã hóa URL cho các ký tự đặc biệt như khoảng trắng (giống cách backend trả về)
    try {
        const urlObj = new URL(fullUrl);
        const decodedPathname = decodeURIComponent(urlObj.pathname);
        if (decodedPathname === urlObj.pathname) {
             urlObj.pathname = encodeURIComponent(urlObj.pathname).replace(/%2F/g, '/');
             fullUrl = urlObj.toString();
        }
    } catch (e) {
        console.warn('Lỗi xử lý URL ảnh:', e);
        return `${this.backendBaseUrl}/assets/placeholder-image.jpg`;
    }

    return fullUrl;
  }

  // Hàm mới để chuyển đổi loại thông tin số thành chuỗi
  getMistakeDetailType(type: number): string {
    switch (type) {
      case 1: return 'Số điện thoại';
      case 2: return 'Số tài khoản ngân hàng';
      case 3: return 'URL';
      default: return 'Không xác định';
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/mistakes']); // Điều hướng về trang danh sách khiếu nại
  }

  // === PHƯƠNG THỨC CHO MODAL XEM ẢNH ===
  openImageModal(index: number): void {
    if (this.mistake?.attachmentUrls && this.mistake.attachmentUrls.length > 0 && index >= 0 && index < this.mistake.attachmentUrls.length) {
      this.currentImageIndex = index;
      this.isImageModalOpen = true;
      document.body.style.overflow = 'hidden';

      setTimeout(() => {
        const overlay = document.querySelector('.image-modal-overlay') as HTMLElement;
        if (overlay) {
          overlay.focus();
        }
      }, 0);
    }
  }

  closeImageModal(): void {
    this.isImageModalOpen = false;
    document.body.style.overflow = 'auto';
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    if (this.mistake?.attachmentUrls) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.mistake.attachmentUrls.length;
    }
  }

  prevImage(event: Event): void {
    event.stopPropagation();
    if (this.mistake?.attachmentUrls) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.mistake.attachmentUrls.length) % this.mistake.attachmentUrls.length;
    }
  }

  getCurrentImageSrc(): string {
    if (this.mistake?.attachmentUrls && this.mistake.attachmentUrls.length > 0) {
      return this.getFullImageUrl(this.mistake.attachmentUrls[this.currentImageIndex]);
    }
    return '';
  }

  onImageModalKeydown(event: KeyboardEvent): void {
    if (this.isImageModalOpen) {
      switch (event.key) {
        case 'Escape':
          this.closeImageModal();
          break;
        case 'ArrowLeft':
          this.prevImage(event);
          break;
        case 'ArrowRight':
          this.nextImage(event);
          break;
      }
    }
  }
}