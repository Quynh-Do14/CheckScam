import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RecaptchaModule } from 'ng-recaptcha';
import { HttpErrorResponse } from '@angular/common/http';
import { ReportService } from '../../../services/report.service';

// IMPORT CÁC DTO TỪ FILE CỦA BẠN
import { CreateReportRequestDTO, ReportDetailItemDTO, ReportTypeOption } from '../../../dtos/create-report-request.dto';

import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from "../../footer/footer.component";
import { ChatBoxComponent } from "../../chat-box/chat-box.component";
import { Observable } from 'rxjs';

// Interface cho Category (vẫn giữ nguyên ở đây hoặc có thể chuyển vào DTO nếu bạn muốn tập trung)
export interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RecaptchaModule, FooterComponent, HeaderComponent, ChatBoxComponent],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateReportComponent implements OnInit {

  @ViewChild('commonFileInput') commonFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('reportForm') reportForm!: NgForm;

  reportType: 'single' | 'group' = 'single';

  requestPayload: CreateReportRequestDTO = {
    emailAuthorReport: '',
    description: '',
    moneyScam: null,
    categoryId: null!,
    reportDetails: [],
    captchaToken: '',
    pageToReport: undefined
  };

  selectedFiles: File[] = [];

  showChatbox: boolean = false;

  categories: Category[] = [
    { id: 1, name: 'Đầu tư' },
    { id: 2, name: 'Bán hàng Online' },
    { id: 3, name: 'Đổi thẻ cào' },
    { id: 4, name: 'Giao dịch trung gian' },
    { id: 5, name: 'Kiếm tiền online' },
    { id: 6, name: 'Lừa đảo, cờ bạc' },
    { id: 7, name: 'Marketing Online' },
    { id: 8, name: 'Nick game' },
    { id: 9, name: 'Nội dung số' },
    { id: 10, name: 'Phần mềm' },
    { id: 11, name: 'Sim số đẹp' },
    { id: 12, name: 'Tài khoản MXH' },
    { id: 13, name: 'Thẻ cào, game' },
    { id: 14, name: 'Tiền ảo' },
    { id: 15, name: 'Dịch vụ khác' },
  ];

  isCategoryDropdownOpen: boolean = false;
  selectedCategoryName: string = '-- Chọn danh mục --';

  reportTypeOptions: ReportTypeOption[] = [
    { id: 1, name: 'Số điện thoại' },
    { id: 2, name: 'Số tài khoản' },
    { id: 3, name: 'URL' },
  ];


  constructor(private reportService: ReportService, private router: Router, private el: ElementRef) { }

  ngOnInit(): void {
    this.addReportDetailItem();
    this.resetFormState();

    if (this.requestPayload.categoryId) {
      const selected = this.categories.find(cat => cat.id === this.requestPayload.categoryId);
      if (selected) {
        this.selectedCategoryName = selected.name;
      }
    }
  }

  // --- Logic cho Category Dropdown ---
  toggleCategoryDropdown() {
    this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
  }

  selectCategory(category: Category) {
    this.requestPayload.categoryId = category.id;
    this.selectedCategoryName = category.name;
    this.isCategoryDropdownOpen = false; // <<< THÊM DÒNG NÀY ĐỂ ĐÓNG DROPDOWN SAU KHI CHỌN
    if (this.reportForm && this.reportForm.controls['categoryId']) {
      this.reportForm.controls['categoryId'].setValue(category.id);
      this.reportForm.controls['categoryId'].markAsTouched();
    }
  }

  // --- Logic cho Report Type Dropdown (Tố cáo về) ---
  toggleReportTypeDropdown(item: ReportDetailItemDTO) {
    this.requestPayload.reportDetails.forEach(detail => {
      if (detail !== item) {
        detail.isTypeDropdownOpen = false;
      }
    });
    item.isTypeDropdownOpen = !item.isTypeDropdownOpen;
  }

  selectReportType(item: ReportDetailItemDTO, option: ReportTypeOption) {
    item.type = option.id;
    item.selectedTypeName = option.name;
    item.isTypeDropdownOpen = false; // <<< THÊM DÒNG NÀY ĐỂ ĐÓNG DROPDOWN SAU KHI CHỌN
    this.resetInfoFields(this.requestPayload.reportDetails.indexOf(item));
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const customSelectCategory = this.el.nativeElement.querySelector('.custom-select-wrapper');
    if (customSelectCategory && !customSelectCategory.contains(event.target as Node)) {
      this.isCategoryDropdownOpen = false;
    }

    this.requestPayload.reportDetails.forEach((item, index) => {
      const customSelectType = this.el.nativeElement.querySelector(`#type_${index}_wrapper`);
      if (item.isTypeDropdownOpen && customSelectType && !customSelectType.contains(event.target as Node)) {
        item.isTypeDropdownOpen = false;
      }
    });
  }

  onReportTypeChange(): void {
    this.requestPayload.emailAuthorReport = '';
    this.requestPayload.description = '';
    this.requestPayload.moneyScam = null;
    this.requestPayload.categoryId = null!;
    this.selectedCategoryName = '-- Chọn danh mục --';
    this.requestPayload.captchaToken = '';
    this.selectedFiles = [];

    this.requestPayload.reportDetails = [];
    this.addReportDetailItem();

    if (this.reportForm && this.reportForm.form) {
      this.reportForm.form.markAsPristine();
      this.reportForm.form.markAsUntouched();
      this.reportForm.form.updateValueAndValidity();
    }
  }

  resetFormState(): void {
    if (this.reportForm) {
      this.reportForm.resetForm();
      this.selectedCategoryName = '-- Chọn danh mục --';
      this.requestPayload.categoryId = null!;
      this.requestPayload.reportDetails.forEach(item => {
        item.isTypeDropdownOpen = false;
        const defaultOption = this.reportTypeOptions.find(opt => opt.id === item.type);
        item.selectedTypeName = defaultOption ? defaultOption.name : '-- Chọn loại tố cáo --';
      });
    }
  }


  onAiTuVanClicked(): void {
    this.showChatbox = true;
  }

  closeChatbox(): void {
    this.showChatbox = false;
  }

  handleCaptchaResponse(token: string | null): void {
    this.requestPayload.captchaToken = token ?? '';
  }

  onFileSelectCommon(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files).filter(file => file.type.startsWith('image/'));
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
    }
    input.value = '';
  }

  onDragOverCommon(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    if (target && target.classList.contains('drop-zone')) {
      target.classList.add('drag-over');
    }
  }

  onDragLeaveCommon(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    if (target && target.classList.contains('drop-zone')) {
      target.classList.remove('drag-over');
    }
  }

  onDropCommon(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    if (target && target.classList.contains('drop-zone')) {
      target.classList.remove('drag-over');
    }

    if (event.dataTransfer && event.dataTransfer.files) {
      const files = Array.from(event.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        this.selectedFiles = [...this.selectedFiles, ...imageFiles];
      } else {
        alert("Chỉ chấp nhận các tệp hình ảnh (PNG, JPG, GIF).");
      }
    }
  }

  removeFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }

  addReportDetailItem(): void {
    const defaultTypeOption = this.reportTypeOptions.find(opt => opt.id === 1);
    this.requestPayload.reportDetails.push({
      type: 1,
      info: '',
      description: '',
      info2: undefined,
      info3: undefined,
      selectedTypeName: defaultTypeOption ? defaultTypeOption.name : 'Số điện thoại',
      isTypeDropdownOpen: false
    });
  }

  removeReportDetailItem(index: number): void {
    if (this.reportType === 'single' && this.requestPayload.reportDetails.length === 1) {
      alert("Báo cáo đơn phải có ít nhất một mục thông tin tố cáo.");
      return;
    }
    if (this.reportType === 'group' && this.requestPayload.reportDetails.length === 1) {
      alert("Báo cáo gộp phải có ít nhất một mục thông tin tố cáo.");
      return;
    }
    this.requestPayload.reportDetails.splice(index, 1);
  }

  resetInfoFields(index: number): void {
    this.requestPayload.reportDetails[index].info2 = undefined;
    this.requestPayload.reportDetails[index].info3 = undefined;
  }

  isFormInvalid(): boolean {
    if (!this.reportForm || !this.reportForm.form) {
      return true;
    }

    if (this.reportForm.invalid || !this.requestPayload.captchaToken) {
      return true;
    }

    if (this.requestPayload.categoryId === null) {
        return true;
    }

    const moneyScamValue = Number(this.requestPayload.moneyScam);
    if (isNaN(moneyScamValue) || moneyScamValue < 10000) {
        return true;
    }

    if (this.requestPayload.reportDetails.length === 0) {
      return true;
    }

    for (const item of this.requestPayload.reportDetails) {
      if (!item.info?.trim() || !item.description?.trim()) {
        return true;
      }
    }
    return false;
  }

  createReport(): void {
    if (this.reportForm && this.reportForm.form) {
      this.reportForm.form.markAllAsTouched();
    }

    if (this.isFormInvalid()) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc và xác nhận Captcha. Đảm bảo số tiền chiếm đoạt lớn hơn hoặc bằng 10,000 VND.');
      return;
    }

    const finalPayload: CreateReportRequestDTO = {
        ...this.requestPayload,
        emailAuthorReport: this.requestPayload.emailAuthorReport.trim(),
        description: this.requestPayload.description.trim(),
        moneyScam: this.requestPayload.moneyScam,
        reportDetails: this.requestPayload.reportDetails.map(item => ({
            type: item.type,
            info: item.info.trim(),
            description: item.description.trim(),
            info2: item.info2?.trim() || undefined,
            info3: item.info3?.trim() || undefined,
        })),
        pageToReport: undefined
    };

    console.log('Đang gửi Payload:', finalPayload);

    this.reportService.createReportUnified(finalPayload).subscribe({
      next: (res: any) => {
        alert('Gửi thông tin báo cáo thành công!');
        const reportId = res.data?.id ?? res.id;
        if (!reportId) {
          alert('Không nhận được ID báo cáo từ server. Không thể tải tệp đính kèm.');
          this.router.navigate(['/bao-cao-thanh-cong']);
          return;
        }
        if (this.selectedFiles.length) {
          this.uploadFiles(reportId, this.selectedFiles);
        } else {
          this.router.navigate(['/bao-cao-thanh-cong']);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Lỗi khi tạo báo cáo:', err);
        let errorMessage = 'Đã xảy ra lỗi khi gửi báo cáo. Vui lòng thử lại sau.';
        if (err.status === 400 && err.error && err.error.message) {
          errorMessage = `Lỗi: ${err.error.message}`;
        } else if (err.status === 400 && err.error?.errors && Array.isArray(err.error.errors)) {
          errorMessage = 'Dữ liệu không hợp lệ: ' + err.error.errors.map((e: any) => e.defaultMessage || e.field || e).join(', ');
        }
        alert(errorMessage);
      }
    });
  }

  private uploadFiles(reportId: string | number, files: File[]): void {
    this.reportService.uploadFiles(reportId, files).subscribe({
      next: () => {
        console.log('Tải tệp đính kèm thành công!');
        this.router.navigate(['/bao-cao-thanh-cong']);
      },
      error: (uploadErr: HttpErrorResponse) => {
        console.error('Lỗi khi tải tệp đính kèm:', uploadErr);
        alert('Đã tạo báo cáo thành công, nhưng không thể tải tệp đính kèm. Vui lòng liên hệ hỗ trợ nếu cần.');
        this.router.navigate(['/bao-cao-thanh-cong']);
      }
    });
  }
}