import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core'; // Import HostListener
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RecaptchaModule } from 'ng-recaptcha';
import { HttpErrorResponse } from '@angular/common/http';

import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from "../../footer/footer.component";
import { MistakeReportService } from '../../../services/mistake-report.service';

// Interface cho các tùy chọn loại thông tin tố cáo (giống ReportTypeOption)
interface TypeToComplainOption {
  id: 1 | 2 | 3;
  name: string;
}

interface MistakeDetailFrontendRequest {
  type: 1 | 2 | 3;
  info: string;
  info2?: string;
  info3?: string;
}
interface MistakeFrontendRequest {
  emailAuthorMistake: string;
  complaintReason: string;
  mistakeDetails: MistakeDetailFrontendRequest[];
  captchaToken: string;
}

@Component({
  selector: 'app-mistake',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RecaptchaModule, FooterComponent, HeaderComponent],
  templateUrl: './mistake.component.html',
  styleUrls: ['./mistake.component.scss']
})
export class MistakeComponent implements OnInit {
  closeChatbox() {
    console.log('Chatbox close event triggered.');
  }

  @ViewChild('fileInputMistake') fileInputMistake!: ElementRef<HTMLInputElement>;
  @ViewChild('mistakeForm') mistakeForm!: NgForm;

  mistakeReportData: {
    typeToComplain: 1 | 2 | 3;
    info: string;
    info2?: string;
    info3?: string;
    emailAuthorReport: string;
    description: string;
    selectedFiles: File[];
  } = {
    typeToComplain: 1, // Giá trị mặc định
    info: '',
    emailAuthorReport: '',
    description: '',
    selectedFiles: [],
  };

  captchaToken: string = '';
  isDraggingOver: boolean = false;

  // Thuộc tính và dữ liệu cho custom dropdown "Loại thông tin bị tố cáo sai"
  isTypeToComplainDropdownOpen: boolean = false;
  selectedTypeToComplainName: string = '-- Chọn loại thông tin --';
  typeToComplainOptions: TypeToComplainOption[] = [
    { id: 1, name: 'Số điện thoại' },
    { id: 2, name: 'Số tài khoản' },
    { id: 3, name: 'URL' },
  ];

  // --- Biến và phương thức mới cho thông báo tùy chỉnh ---
  showNotification: boolean = false;
  notificationMessage: string = '';
  notificationType: 'success' | 'error' | 'info' = 'info'; // 'success', 'error', 'info'
  notificationTimeout: any;
  // --- Kết thúc phần thông báo tùy chỉnh ---


  constructor(
    private mistakeReportService: MistakeReportService,
    private router: Router,
    private el: ElementRef // Import ElementRef để xử lý click bên ngoài
  ) { }

  ngOnInit(): void {
    // Khởi tạo tên hiển thị mặc định cho dropdown
    const defaultOption = this.typeToComplainOptions.find(opt => opt.id === this.mistakeReportData.typeToComplain);
    if (defaultOption) {
      this.selectedTypeToComplainName = defaultOption.name;
    }
  }

  // --- Phương thức hiển thị và đóng thông báo (sao chép từ create.component.ts) ---
  showAppNotification(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 5000): void {
    // Xóa bất kỳ timeout nào đang chạy để thông báo cũ không tự đóng giữa chừng
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    // Tự động đóng thông báo sau một khoảng thời gian
    this.notificationTimeout = setTimeout(() => {
      this.closeNotification();
    }, duration);
  }

  closeNotification(): void {
    this.showNotification = false;
    this.notificationMessage = '';
    // Clear the timeout in case user closes manually
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }
  // --- Kết thúc phần thông báo tùy chỉnh ---

  // --- Logic cho Custom Dropdown "Loại thông tin bị tố cáo sai" ---
  toggleTypeToComplainDropdown() {
    this.isTypeToComplainDropdownOpen = !this.isTypeToComplainDropdownOpen;
  }

  selectTypeToComplain(option: TypeToComplainOption) {
    this.mistakeReportData.typeToComplain = option.id;
    this.selectedTypeToComplainName = option.name;
    this.isTypeToComplainDropdownOpen = false; // Đóng dropdown sau khi chọn
    this.resetMistakeInfoFields(); // Gọi hàm reset khi thay đổi loại

    // Cập nhật NgForm để validation hoạt động
    if (this.mistakeForm && this.mistakeForm.controls['typeToComplain']) {
      this.mistakeForm.controls['typeToComplain'].setValue(option.id);
      this.mistakeForm.controls['typeToComplain'].markAsTouched();
    }
  }

  // Lắng nghe click bên ngoài để đóng dropdown
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const customSelectWrapper = this.el.nativeElement.querySelector('.custom-select-wrapper');
    if (customSelectWrapper && !customSelectWrapper.contains(event.target as Node)) {
      this.isTypeToComplainDropdownOpen = false;
    }
  }
  // --- KẾT THÚC Logic cho Custom Dropdown ---

  handleCaptchaResponse(token: string | null): void {
    this.captchaToken = token ?? '';
  }

  onFileSelectMistake(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const selectedFiles = Array.from(input.files).filter(file => file.type.startsWith('image/'));
      if (selectedFiles.length > 0) {
        this.mistakeReportData.selectedFiles = selectedFiles;
      } else {
        // Thay thế alert bằng thông báo tùy chỉnh
        this.showAppNotification("Chỉ chấp nhận các tệp hình ảnh (PNG, JPG, GIF).", 'error');
      }
    }
    input.value = '';
  }

  onDragOverMistake(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = true;
  }

  onDragLeaveMistake(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;
  }

  onDropMistake(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;

    if (event.dataTransfer && event.dataTransfer.files) {
      const files = Array.from(event.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        this.mistakeReportData.selectedFiles = imageFiles;
      } else {
        // Thay thế alert bằng thông báo tùy chỉnh
        this.showAppNotification("Chỉ chấp nhận các tệp hình ảnh (PNG, JPG, GIF).", 'error');
      }
    }
  }

  removeFile(file: File): void {
    this.mistakeReportData.selectedFiles = this.mistakeReportData.selectedFiles.filter(f => f !== file);
  }

  resetMistakeInfoFields(): void {
    this.mistakeReportData.info2 = undefined;
    this.mistakeReportData.info3 = undefined;
  }

  openTermsAndConditions(event: Event): void {
    // Thay thế alert bằng thông báo tùy chỉnh
    this.showAppNotification('Đây là nơi hiển thị các điều khoản và điều kiện. Bạn có thể mở một modal hoặc điều hướng đến một trang riêng.', 'info');
  }

  submitMistakeReport(): void {
    this.mistakeForm.form.markAllAsTouched();

    if (this.mistakeForm.invalid || !this.captchaToken) {
      // Thay thế alert bằng thông báo tùy chỉnh
      this.showAppNotification('Vui lòng điền đầy đủ các trường bắt buộc và xác nhận Captcha.', 'error');
      return;
    }

    const mistakeDetail: MistakeDetailFrontendRequest = {
      type: this.mistakeReportData.typeToComplain,
      info: this.mistakeReportData.info.trim(),
      info2: this.mistakeReportData.info2 ? this.mistakeReportData.info2.trim() : undefined,
      info3: this.mistakeReportData.info3 ? this.mistakeReportData.info3.trim() : undefined,
    };

    const payload: MistakeFrontendRequest = {
      emailAuthorMistake: this.mistakeReportData.emailAuthorReport.trim(),
      complaintReason: this.mistakeReportData.description.trim(),
      mistakeDetails: [mistakeDetail],
      captchaToken: this.captchaToken,
    };

    this.sendMistakeReport(payload, this.mistakeReportData.selectedFiles);
  }

  private sendMistakeReport(payload: MistakeFrontendRequest, files: File[]): void {
    this.mistakeReportService.createMistakeReport(payload).subscribe({
      next: (res: any) => {
        // Thay thế alert bằng thông báo tùy chỉnh
        this.showAppNotification('Gửi khiếu nại thành công! Chúng tôi sẽ xem xét với trường hợp của bạn', 'success', 5000); // 3 giây để đọc
        
        const complaintId = res.data?.id ?? res.id;
        if (!complaintId) {
          console.warn('Không nhận được ID khiếu nại từ server. Không thể tải tệp đính kèm.');
          // Thay thế alert bằng thông báo tùy chỉnh
          this.showAppNotification('Không nhận được ID khiếu nại từ server. Không thể tải tệp đính kèm.', 'info');
          setTimeout(() => { // Đảm bảo người dùng đọc được thông báo trước khi chuyển hướng
            this.router.navigate(['/khieu-nai-thanh-cong']);
          }, 3000);
          return;
        }
        if (files.length > 0) {
          this.uploadFiles(complaintId, files);
        } else {
          setTimeout(() => { // Đảm bảo người dùng đọc được thông báo trước khi chuyển hướng
            this.router.navigate(['/khieu-nai-thanh-cong']);
          }, 3000);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Lỗi khi gửi khiếu nại:', err);
        const errorMessage = err.error?.message || err.message || 'Lỗi không xác định.';
        let fieldErrors = '';
        if (err.error && err.error.errors && Array.isArray(err.error.errors)) {
          fieldErrors = err.error.errors.map((e: any) => e.defaultMessage || e.message || 'Lỗi trường không xác định.').join('\n');
        }

        // Thay thế alert lỗi bằng thông báo tùy chỉnh
        this.showAppNotification(`Gửi khiếu nại thất bại: ${errorMessage}\n${fieldErrors || ''}`, 'error');
      }
    });
  }

  private uploadFiles(complaintId: string, files: File[]): void {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, file.name);
    });

    this.mistakeReportService.uploadFiles(complaintId, formData).subscribe({
      next: () => {
        // Thay thế alert bằng thông báo tùy chỉnh
        this.showAppNotification('Tải lên tệp đính kèm thành công! Chúng tôi sẽ xem xét với trường hợp của bạn', 'success', 5000); // 3 giây để đọc
        setTimeout(() => { // Đảm bảo người dùng đọc được thông báo trước khi chuyển hướng
          this.router.navigate(['/khieu-nai-thanh-cong']);
        }, 3000);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Lỗi khi tải lên tệp đính kèm:', err);
        // Thay thế alert lỗi bằng thông báo tùy chỉnh
        this.showAppNotification('Lỗi khi tải lên tệp đính kèm. Vui lòng thử lại hoặc liên hệ hỗ trợ.', 'error');
        setTimeout(() => { // Đảm bảo người dùng đọc được thông báo trước khi chuyển hướng
          this.router.navigate(['/khieu-nai-thanh-cong']);
        }, 3000);
      }
    });
  }
}