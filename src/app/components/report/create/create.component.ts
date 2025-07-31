import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RecaptchaModule } from 'ng-recaptcha';
import { HttpErrorResponse } from '@angular/common/http';
import { ReportService } from '../../../services/report.service';
import { Title, Meta } from '@angular/platform-browser';

import { CreateReportRequestDTO, ReportDetailItemDTO, ReportTypeOption } from '../../../dtos/create-report-request.dto';

import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from "../../footer/footer.component";
import { ChatBoxComponent } from "../../chat-box/chat-box.component";
import { Observable } from 'rxjs';

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
  fileCountError: string | null = null;
  readonly MAX_FILES = 10;

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

  showNotification: boolean = false;
  notificationMessage: string = '';
  notificationType: 'success' | 'error' | 'info' = 'info';
  notificationTimeout: any;


  constructor(
    private reportService: ReportService,
    private router: Router,
    private el: ElementRef,
    private titleService: Title,
    private metaService: Meta
  ) { }

  ngOnInit(): void {
    this.addReportDetailItem();
    this.resetFormState();

    if (this.requestPayload.categoryId) {
      const selected = this.categories.find(cat => cat.id === this.requestPayload.categoryId);
      if (selected) {
        this.selectedCategoryName = selected.name;
      }
    }

    this.titleService.setTitle('Báo Cáo Lừa Đảo');

    this.metaService.updateTag({
      name: 'description',
      content: 'Báo cáo lừa đảo cho AI6 - Săn Người Xấu, Diệt Kẻ Gian để phân tích qua số điện thoại, tài khoản, URL. Dữ liệu được xác minh từ Bộ Công An – cùng diệt kẻ gian và bảo vệ cộng đồng Việt Nam ngay hôm nay!'
    });
  }

  showAppNotification(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 5000): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    this.notificationTimeout = setTimeout(() => {
      this.closeNotification();
    }, duration);
  }

  closeNotification(): void {
    this.showNotification = false;
    this.notificationMessage = '';
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

  toggleCategoryDropdown() {
    this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
  }

  selectCategory(category: Category) {
    this.requestPayload.categoryId = category.id;
    this.selectedCategoryName = category.name;
    this.isCategoryDropdownOpen = false;
    if (this.reportForm && this.reportForm.controls['categoryId']) {
      this.reportForm.controls['categoryId'].setValue(category.id);
      this.reportForm.controls['categoryId'].markAsTouched();
    }
  }

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
    item.isTypeDropdownOpen = false;
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
    this.fileCountError = null;

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
      this.selectedFiles = [];
      this.fileCountError = null;
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
    this.fileCountError = null;
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files).filter(file => file.type.startsWith('image/'));

      if (this.selectedFiles.length + newFiles.length > this.MAX_FILES) {
        this.fileCountError = `Bạn chỉ có thể tải lên tối đa ${this.MAX_FILES} ảnh. Vui lòng chọn ít hơn.`;
        input.value = '';
        return;
      }
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

    this.fileCountError = null;

    if (event.dataTransfer && event.dataTransfer.files) {
      const files = Array.from(event.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (this.selectedFiles.length + imageFiles.length > this.MAX_FILES) {
        this.fileCountError = `Bạn chỉ có thể tải lên tối đa ${this.MAX_FILES} ảnh. Vui lòng chọn ít hơn.`;
        return;
      }

      if (imageFiles.length > 0) {
        this.selectedFiles = [...this.selectedFiles, ...imageFiles];
      } else {
        this.showAppNotification("Chỉ chấp nhận các tệp hình ảnh (PNG, JPG, GIF).", 'error');
      }
    }
  }

  removeFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
    if (this.selectedFiles.length <= this.MAX_FILES) {
      this.fileCountError = null;
    }
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
      this.showAppNotification("Báo cáo đơn phải có ít nhất một mục thông tin tố cáo.", 'info');
      return;
    }
    if (this.reportType === 'group' && this.requestPayload.reportDetails.length === 1) {
      this.showAppNotification("Báo cáo gộp phải có ít nhất một mục thông tin tố cáo.", 'info');
      return;
    }
    this.requestPayload.reportDetails.splice(index, 1);
  }

  resetInfoFields(index: number): void {
    this.requestPayload.reportDetails[index].info2 = undefined;
    this.requestPayload.reportDetails[index].info3 = undefined;
  }

  formatMoney(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  onMoneyScamInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let rawValue = inputElement.value;

    let numericValue = rawValue.replace(/\D/g, '');

    this.requestPayload.moneyScam = numericValue ? parseInt(numericValue, 10) : null;

    if (this.reportForm && this.reportForm.controls['scamAmount']) {
      this.reportForm.controls['scamAmount'].markAsDirty();
      this.reportForm.controls['scamAmount'].updateValueAndValidity();
    }
  }

  isFormInvalid(): boolean {
    if (!this.reportForm || !this.reportForm.form) {
      return true;
    }

    if (!this.requestPayload.captchaToken) {
      return true;
    }

    if (this.fileCountError) {
      return true;
    }

    return this.reportForm.invalid!;
  }

  createReport(): void {
    if (this.reportForm && this.reportForm.form) {
      this.reportForm.form.markAllAsTouched();
    }

    if (this.selectedFiles.length > this.MAX_FILES) {
      this.fileCountError = `Bạn chỉ có thể tải lên tối đa ${this.MAX_FILES} ảnh. Vui lòng xóa bớt ảnh.`;
      this.showAppNotification(this.fileCountError, 'error');
      return;
    }

    if (this.isFormInvalid()) {
      this.showAppNotification('Vui lòng điền đầy đủ các trường bắt buộc, xác nhận Captcha và kiểm tra số lượng ảnh đính kèm (tối đa 10 ảnh).', 'error');
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
        this.showAppNotification('Gửi thông tin báo cáo thành công! Bạn sẽ được chuyển hướng về trang chủ trong giây lát.', 'success', 5000);

        const reportId = res.data?.id ?? res.id;
        if (!reportId) {
          this.showAppNotification('Không nhận được ID báo cáo từ server. Không thể tải tệp đính kèm.', 'info');
          setTimeout(() => {
            this.router.navigate(['/bao-cao-thanh-cong']);
          }, 3000);
          return;
        }
        if (this.selectedFiles.length) {
          this.uploadFiles(reportId, this.selectedFiles);
        } else {
          setTimeout(() => {
            this.router.navigate(['/bao-cao-thanh-cong']);
          }, 3000);
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
        this.showAppNotification(errorMessage, 'error');
      }
    });
  }

  private uploadFiles(reportId: string | number, files: File[]): void {
    this.reportService.uploadFiles(reportId, files).subscribe({
      next: () => {
        console.log('Tải tệp đính kèm thành công!');
        this.showAppNotification('Tệp đính kèm đã được tải lên thành công! Bạn sẽ được chuyển hướng về trang chủ trong giây lát.', 'success', 5000);
        setTimeout(() => {
          this.router.navigate(['/bao-cao-thanh-cong']);
        }, 3000);
      },
      error: (uploadErr: HttpErrorResponse) => {
        console.error('Lỗi khi tải tệp đính kèm:', uploadErr);
        this.showAppNotification('Đã tạo báo cáo thành công, nhưng không thể tải tệp đính kèm. Vui lòng liên hệ hỗ trợ nếu cần.', 'error');
        setTimeout(() => {
          this.router.navigate(['/bao-cao-thanh-cong']);
        }, 3000);
      }
    });
  }
}