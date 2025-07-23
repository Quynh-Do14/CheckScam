import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, Validators, ValidatorFn, AbstractControl } from '@angular/forms'; // Import Validators and related types
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { environment } from '../../../environments/environment';
import { RecaptchaModule } from 'ng-recaptcha';

// Updated Contract interface
interface Contract {
  roomName: string;
  categoryId: number | null;
  partyAName: string;
  partyAPhone: string;
  partyAEmail: string; // Optional field
  partyBName: string; // New field for Party B
  partyBPhone: string; // New field for Party B
  partyBEmail: string; // Optional field for Party B
  partyBId: number | null; // Still needs agent ID
  securityCode: string;
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
  @ViewChild('reportForm') reportForm!: NgForm; // Ensure your form has #reportForm template reference

  public recaptchaSiteKey: string = "6LeT6X0rAAAAAB47lw0XhdRpi2nv7UR35dh4VcP_";

  contract: Contract = {
    roomName: '',
    categoryId: null,
    partyAName: '',
    partyAPhone: '',
    partyAEmail: '',
    partyBName: '', // Initialize new fields
    partyBPhone: '', // Initialize new fields
    partyBEmail: '', // Initialize new fields
    partyBId: null,
    securityCode: '',
    captchaToken: null
  };

  categories: Category[] = [];
  isCategoryDropdownOpen: boolean = false;
  selectedCategoryName: string = '--- Chọn danh mục ---';
  formSubmitted: boolean = false;
  transactionCode: string = ''; // New property for transaction code

  agentId: number | null = null;
  agentName: string | null = null;
  agentEmail: string | null = null;

  private readonly BASE_URL = `${environment.apiUrl}`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.generateTransactionCode(); // Generate code on init

    this.route.paramMap.subscribe(params => {
      this.agentId = +params.get('agentId')!;
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras.state) {
        this.agentName = navigation.extras.state['agentName'];
        this.agentEmail = navigation.extras.state['agentEmail'];
        if (this.agentId) {
          this.contract.partyBId = this.agentId;
        }
      }
      // If agentName is null, consider fetching it or showing a generic message
      if (!this.agentName && this.agentId) {
        // Here you might call an API to get agent details by ID
        // For now, let's just set a default display name
        this.agentName = `Giao dịch viên ID: ${this.agentId}`;
      }
    });
  }

  generateTransactionCode(): void {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = today.getFullYear();
    // For STT, you might fetch the last STT from a database or use a simple counter
    // For demo, let's use a random number as a placeholder for STT. In a real app, this would be sequential.
    const stt = Math.floor(1000 + Math.random() * 9000); // Simple 4-digit random number
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

  toggleCategoryDropdown(): void {
    this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
  }

  selectCategory(category: Category): void {
    this.contract.categoryId = category.id;
    this.selectedCategoryName = category.name;
    this.isCategoryDropdownOpen = false;
  }

  handleCaptchaResponse(response: string | null): void {
    this.contract.captchaToken = response;
    console.log(`reCAPTCHA resolved with response: ${response}`);
  }

  // Custom validator for email format (optional, but good practice)
  emailValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      const valid = !control.value || emailRegex.test(control.value);
      return valid ? null : { 'email': { value: control.value } };
    };
  }

  isFormValid(): boolean {
    // Check required fields
    const requiredFieldsFilled =
      !!this.contract.roomName &&
      this.contract.categoryId !== null &&
      !!this.contract.partyAName &&
      !!this.contract.partyAPhone &&
      !!this.contract.partyBName && // New required field
      !!this.contract.partyBPhone && // New required field
      !!this.contract.securityCode &&
      !!this.contract.captchaToken;

    // Check optional email validity if filled
    const emailAValid = !this.contract.partyAEmail || this.emailValidator()(this.reportForm?.controls['partyAEmail']) === null;
    const emailBValid = !this.contract.partyBEmail || this.emailValidator()(this.reportForm?.controls['partyBEmail']) === null;

    // Ensure agentId is present
    const agentIdPresent = this.contract.partyBId !== null;

    return requiredFieldsFilled && emailAValid && emailBValid && agentIdPresent;
  }

  createTransaction(): void {
    this.formSubmitted = true;

    // Manually trigger validation on all controls if form is not valid
    if (this.reportForm) {
      Object.keys(this.reportForm.controls).forEach(key => {
        this.reportForm.controls[key].markAsDirty();
        this.reportForm.controls[key].updateValueAndValidity();
      });
    }

    if (!this.isFormValid()) {
      alert('Vui lòng điền đầy đủ và chính xác tất cả các trường bắt buộc, bao gồm cả xác nhận CAPTCHA.');
      return;
    }

    // Prepare data to send (including optional emails if filled)
    const transactionData = {
      ...this.contract,
      transactionCode: this.transactionCode, // Add the generated transaction code
      partyAEmail: this.contract.partyAEmail || null, // Send null if empty
      partyBEmail: this.contract.partyBEmail || null, // Send null if empty
    };

    console.log('Dữ liệu hợp đồng:', transactionData);

    // This is where you would typically send data to your backend API
    // this.http.post(`${this.BASE_URL}/api/transactions`, transactionData).subscribe(
    //   response => {
    //     alert('Phòng giao dịch đã được tạo thành công!');
    //     this.router.navigate(['/transactions']); // Navigate to transactions list or detail page
    //   },
    //   error => {
    //     console.error('Lỗi khi tạo phòng giao dịch:', error);
    //     alert('Có lỗi xảy ra khi tạo phòng giao dịch. Vui lòng thử lại.');
    //   }
    // );

    // For demo purposes:
    alert('Phòng giao dịch đã được tạo thành công! (Chức năng tạo API đang chờ triển khai)');
    this.router.navigate(['/transactions']); // Or to a success page
  }

  goBack(): void {
    if (this.agentId) {
      this.router.navigate(['/transactions/agent', this.agentId]);
    } else {
      this.router.navigate(['/']); // Fallback to home or general transactions list
    }
  }
}