import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // Đổi lại thành '@angular/router'
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { environment } from '../../../environments/environment';
import { RecaptchaModule } from 'ng-recaptcha';

interface Contract {
  roomName: string;
  categoryId: number | null;
  partyAName: string;
  partyAPhone: string;
  partyAEmail: string;
  partyBId: number | null; // Vẫn cần ID giao dịch viên để gửi đi
  securityCode: string;
  captchaToken: string | null;
}

interface Category {
  id: number;
  name: string;
}

// Bỏ interface Agent nếu không còn dùng để chọn từ dropdown

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
    partyBId: null, // Sẽ được lấy từ route
    securityCode: '',
    captchaToken: null
  };

  categories: Category[] = [];
  // Bỏ 'agents: Agent[] = [];'
  isCategoryDropdownOpen: boolean = false;
  // Bỏ 'isAgentDropdownOpen: boolean = false;'
  selectedCategoryName: string = '--- Chọn danh mục ---';
  // Bỏ 'selectedAgentName: string = '--- Chọn giao dịch viên ---';'
  formSubmitted: boolean = false;

  agentId: number | null = null;
  agentName: string | null = null;
  agentEmail: string | null = null; // Email của giao dịch viên hiện tại, dùng để gửi đi nếu cần

  private readonly BASE_URL = `${environment.apiUrl}`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    // Bỏ loadAgents()

    this.route.paramMap.subscribe(params => {
      this.agentId = +params.get('agentId')!;
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras.state) {
        this.agentName = navigation.extras.state['agentName'];
        this.agentEmail = navigation.extras.state['agentEmail'];
        // Gán ID của giao dịch viên hiện tại vào contract
        if (this.agentId) {
          this.contract.partyBId = this.agentId;
        }
      } else if (this.agentId) {
        // Trong trường hợp refresh hoặc truy cập trực tiếp bằng ID mà không có state
        // Có thể cần gọi API để lấy thông tin agent nếu không có trong state
        // Hiện tại, tạm thời sử dụng agentId và giả định tên/email cho mục đích hiển thị
        // Hoặc cần một service để quản lý thông tin agent nếu muốn persistent
      }
    });
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
    // Bỏ đóng dropdown giao dịch viên vì không còn dropdown đó
  }

  // Bỏ toggleAgentDropdown() và selectAgent()

  selectCategory(category: Category): void {
    this.contract.categoryId = category.id;
    this.selectedCategoryName = category.name;
    this.isCategoryDropdownOpen = false;
  }

  handleCaptchaResponse(response: string | null): void {
    this.contract.captchaToken = response;
    console.log(`reCAPTCHA resolved with response: ${response}`);
  }

  isFormValid(): boolean {
    return !!this.contract.roomName &&
           this.contract.categoryId !== null &&
           !!this.contract.partyAName &&
           !!this.contract.partyAPhone &&
           !!this.contract.partyAEmail &&
           this.contract.partyBId !== null && // Vẫn kiểm tra ID giao dịch viên
           !!this.contract.securityCode &&
           !!this.contract.captchaToken;
  }

  createTransaction(): void {
    this.formSubmitted = true;

    if (!this.isFormValid()) {
      alert('Vui lòng điền đầy đủ tất cả các trường và xác nhận CAPTCHA.');
      return;
    }

    // Gửi partyBId và agentEmail (nếu có)
    console.log('Dữ liệu hợp đồng:', {
      ...this.contract,
      partyBEmail: this.agentEmail // Gửi email của giao dịch viên hiện tại
    });

    alert('Phòng giao dịch đã được tạo thành công! (Chức năng tạo API đang chờ triển khai)');
    this.router.navigate(['/transactions']);
  }

  goBack(): void {
    // Luôn quay lại trang chi tiết giao dịch viên nếu có ID
    if (this.agentId) {
      this.router.navigate(['/transactions/agent', this.agentId]);
    } else {
      // Xử lý trường hợp không có agentId (ví dụ: quay về trang chủ hoặc danh sách giao dịch viên chung)
      this.router.navigate(['/']); // Hoặc route phù hợp
    }
  }
}