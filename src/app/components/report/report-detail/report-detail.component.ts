import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../../services/report.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ReportProcessingStatus } from '../report-management/report-management.component';
import { ToastrService } from 'ngx-toastr';

// Import các DTO
import { ReportDetailDto } from '../../../dtos/report-detail.dto';
import { AttachmentDto } from '../../../dtos/attachment.dto'; // Đảm bảo có AttachmentDto

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.scss'],
  providers: [DatePipe]
})
export class ReportDetailComponent implements OnInit {
  reportId!: number;
  report: ReportDetailDto | null = null;
  loading: boolean = true;
  error: string | null = null;

  ReportProcessingStatus = ReportProcessingStatus;

  backendBaseUrl: string = 'http://localhost:8080'; // URL cơ sở của backend nơi ảnh được lưu trữ

  // === BIẾN MỚI CHO MODAL XEM ẢNH ===
  isImageModalOpen: boolean = false; // Trạng thái hiển thị/ẩn modal
  currentImageIndex: number = 0; // Chỉ số của ảnh hiện tại đang được xem trong modal
  // ===================================

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.reportId = +idParam;
        this.getReportDetails();
      } else {
        this.error = 'ID báo cáo không hợp lệ.';
        this.loading = false;
        this.toastr.error('ID báo cáo không hợp lệ.', 'Lỗi');
      }
    });
  }

  getReportDetails(): void {
    this.loading = true;
    this.reportService.getReportById(this.reportId).subscribe(
      (data: ReportDetailDto) => {
        this.report = data;
        this.loading = false;
        console.log('Chi tiết báo cáo:', this.report);
      },
      (err) => {
        this.error = 'Không thể tải chi tiết báo cáo. Vui lòng thử lại sau.';
        this.loading = false;
        console.error('Lỗi khi tải chi tiết báo cáo:', err);
        this.toastr.error('Không thể tải chi tiết báo cáo. Vui lòng thử lại sau.', 'Lỗi');
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
    if (fullUrl.startsWith('/uploads/')) {
      fullUrl = `${this.backendBaseUrl}${fullUrl}`;
    } else if (fullUrl.startsWith('uploads/')) {
      fullUrl = `${this.backendBaseUrl}/${fullUrl}`;
    } else {
      // Giả định đây là tên file và cần thêm /uploads/
      fullUrl = `${this.backendBaseUrl}/uploads/${fullUrl}`;
    }

    // Xử lý mã hóa URL cho các ký tự đặc biệt như khoảng trắng (giống cách backend trả về)
    // Ví dụ: Huynh Nhat Phi_2_1.jpg có thể trở thành Hu%E1%BB%B3nh%20Nh%E1%BA%ADt%20Phi_2_1.jpg
    try {
        const urlObj = new URL(fullUrl);
        // Kiểm tra xem pathname đã được encode chưa
        const decodedPathname = decodeURIComponent(urlObj.pathname);
        // Nếu decodedPathname khác urlObj.pathname, nghĩa là nó đã được encode rồi
        // Nếu không, encode lại để đảm bảo
        if (decodedPathname === urlObj.pathname) {
             urlObj.pathname = encodeURIComponent(urlObj.pathname).replace(/%2F/g, '/'); // Giữ lại dấu '/'
             fullUrl = urlObj.toString();
        }
    } catch (e) {
        console.warn('Lỗi xử lý URL ảnh:', e);
        // Nếu URL không hợp lệ, có thể trả về placeholder hoặc URL gốc
        return `${this.backendBaseUrl}/assets/placeholder-image.jpg`;
    }

    return fullUrl;
  }

  getProcessingStatusText(status: number | undefined): string {
    if (status === undefined || status === null) {
      return 'Không xác định';
    }
    switch (status) {
      case ReportProcessingStatus.PENDING: return 'Đang chờ xử lý';
      case ReportProcessingStatus.APPROVED: return 'Đã duyệt';
      case ReportProcessingStatus.REJECTED: return 'Đã từ chối';
      default: return 'Không xác định';
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/reports']);
  }

  // === PHƯƠNG THỨC MỚI CHO MODAL XEM ẢNH ===
  openImageModal(index: number): void {
    if (this.report?.attachments && this.report.attachments.length > 0 && index >= 0 && index < this.report.attachments.length) {
      this.currentImageIndex = index;
      this.isImageModalOpen = true;
      document.body.style.overflow = 'hidden'; // Ngăn cuộn trang chính
      
      // Tập trung vào overlay của modal để bắt sự kiện keydown
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
    document.body.style.overflow = 'auto'; // Cho phép cuộn trang chính trở lại
  }

  nextImage(event: Event): void {
    event.stopPropagation(); // NGĂN SỰ KIỆN CLICK LAN RA NỀN
    if (this.report?.attachments) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.report.attachments.length;
    }
  }

  prevImage(event: Event): void {
    event.stopPropagation(); // NGĂN SỰ KIỆN CLICK LAN RA NỀN
    if (this.report?.attachments) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.report.attachments.length) % this.report.attachments.length;
    }
  }

  getCurrentImageSrc(): string {
    if (this.report?.attachments && this.report.attachments.length > 0) {
      return this.getFullImageUrl(this.report.attachments[this.currentImageIndex].url);
    }
    return '';
  }

  // Handle keyboard navigation for modal (tương tự subject-detail)
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
  // ===========================================
}