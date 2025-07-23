import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { RecaptchaModule } from 'ng-recaptcha';
import { TransactionCreationService, CreateTransactionPayload } from '../../../services/transactions.service';

interface Contract {
  roomName: string;
  categoryId: number | null;
  partyAName: string;
  partyAPhone: string;
  partyAEmail: string;
  partyBName: string;
  partyBPhone: string;
  partyBEmail: string;
  dealerName: string;
  dealerEmail: string;
  captchaToken: string | null;
}

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-create-contract',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, RecaptchaModule],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateContractComponent implements OnInit {
  @ViewChild('reportForm') reportForm!: NgForm;

  public recaptchaSiteKey: string = "6LeT6X0rAAAAAB47lw0XhdRpi2nv7UR35dh4VcP_";

  contract: Contract = {
    roomName: '',
    categoryId: null,
    partyAName: '',
    partyAPhone: '',
    partyAEmail: '',
    partyBName: '',
    partyBPhone: '',
    partyBEmail: '',
    dealerName: '',
    dealerEmail: '',
    captchaToken: null
  };

  categories: Category[] = [];
  public isCategoryDropdownOpen: boolean = false;
  public selectedCategoryName: string = '--- Chọn danh mục ---';
  public formSubmitted: boolean = false;
  public transactionCode: string = '';
  public isLoading: boolean = false;

  public notification = {
    message: '',
    type: '',
    icon: '',
    timeout: null as any
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private transactionCreationService: TransactionCreationService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.generateTransactionCode();
  }

  generateTransactionCode(): void {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const stt = Math.floor(1000 + Math.random() * 9000);
    this.transactionCode = `${stt}-${day}/${month}/${year}`;
  }

  loadCategories(): void {
    this.categories = [
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
  }

  public toggleCategoryDropdown(): void {
    this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
  }

  public selectCategory(category: Category): void {
    this.contract.categoryId = category.id;
    this.selectedCategoryName = category.name;
    this.isCategoryDropdownOpen = false;
  }

  public handleCaptchaResponse(response: string | null): void {
    this.contract.captchaToken = response;
    console.log(`reCAPTCHA resolved with response: ${response}`);
  }

  public emailValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      const valid = !control.value || emailRegex.test(control.value);
      return valid ? null : { 'email': { value: control.value } };
    };
  }

  public isFormValid(): boolean {
    // Ensuring reportForm and its controls are available before accessing them
    if (!this.reportForm || !this.reportForm.controls) {
      return false; // Or handle as appropriate, maybe throw an error or log a warning
    }

    const emailAValid = !this.contract.partyAEmail || this.emailValidator()(this.reportForm.controls['partyAEmail']) === null;
    const emailBValid = !this.contract.partyBEmail || this.emailValidator()(this.reportForm.controls['partyBEmail']) === null;
    const dealerEmailValid = this.emailValidator()(this.reportForm.controls['dealerEmail']) === null;

    const requiredFieldsFilled =
      !!this.contract.roomName &&
      !!this.contract.partyAName &&
      !!this.contract.partyAPhone &&
      !!this.contract.partyBName &&
      !!this.contract.partyBPhone &&
      !!this.contract.captchaToken &&
      !!this.contract.dealerName &&
      !!this.contract.dealerEmail;

    return requiredFieldsFilled && emailAValid && emailBValid && dealerEmailValid;
  }

  public showNotification(message: string, type: 'success' | 'error' | 'warning', duration: number = 5000): void {
    this.clearNotification();

    let iconClass = '';
    switch (type) {
      case 'success':
        iconClass = 'fas fa-check-circle';
        break;
      case 'error':
        iconClass = 'fas fa-exclamation-circle';
        break;
      case 'warning':
        iconClass = 'fas fa-exclamation-triangle';
        break;
    }

    this.notification = {
      message: message,
      type: type,
      icon: iconClass,
      timeout: setTimeout(() => this.clearNotification(), duration)
    };
  }

  public clearNotification(): void {
    if (this.notification.timeout) {
      clearTimeout(this.notification.timeout);
      this.notification.timeout = null;
    }
    this.notification.message = '';
    this.notification.type = '';
    this.notification.icon = '';
  }

  public createTransaction(): void {
    this.formSubmitted = true;
    this.clearNotification();

    if (this.reportForm) {
      Object.keys(this.reportForm.controls).forEach(key => {
        const control = this.reportForm.controls[key];
        if (control) { // Ensure control exists before marking
          control.markAsDirty();
          control.updateValueAndValidity();
        }
      });
    }

    if (!this.reportForm.valid || !this.isFormValid()) {
      console.warn('Form không hợp lệ. Vui lòng kiểm tra lại các trường.');
      this.showNotification('Vui lòng điền đầy đủ và chính xác các thông tin bắt buộc!', 'warning', 6000);
      return;
    }

    this.isLoading = true; // Bật loading

    const payload: CreateTransactionPayload = {
      dealerName: this.contract.dealerName,
      dealerEmail: this.contract.dealerEmail,
      partyAName: this.contract.partyAName,
      partyAEmail: this.contract.partyAEmail || '',
      partyAPhone: this.contract.partyAPhone,
      partyBName: this.contract.partyBName,
      partyBEmail: this.contract.partyBEmail || '',
      partyBPhone: this.contract.partyBPhone,
      roomName: this.contract.roomName,
      transactionCode: this.transactionCode
    };

    console.log('Dữ liệu hợp đồng gửi đi:', payload);

    this.transactionCreationService.createTransaction(payload).subscribe({
      next: (response) => {
        this.isLoading = false; // Tắt loading ngay sau khi nhận được response thành công
        console.log('✅ Giao dịch được tạo thành công:', response);

        // Hiển thị thông báo thành công và sau đó mới chuyển hướng
        this.showNotification(
          `Phòng "${this.contract.roomName}" tạo thành công! Mã giao dịch: ${response.transactionId}. Bạn sẽ được chuyển hướng sau giây lát.`,
          'success',
          5000 // Giữ thông báo hiển thị trong 5 giây
        );

        // Đặt timeout chuyển hướng sau khi thông báo đã được hiển thị đủ thời gian
        setTimeout(() => {
          this.router.navigate(['/transactions']);
        }, 5000); // Chuyển hướng sau 5 giây (thời gian hiển thị thông báo)
      },
      error: (error) => {
        this.isLoading = false; // Tắt loading khi có lỗi
        console.error('❌ Lỗi khi tạo giao dịch:', error);
        this.showNotification(
          `Lỗi: ${error.error?.message || 'Không thể tạo phòng giao dịch. Vui lòng thử lại.'}`,
          'error',
          7000
        );
      }
    });
  }

  public goBack(): void {
    this.router.navigate(['/transactions']);
  }
}