import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckScamService } from '../../services/check-scam.service';
import { CheckScamRequestDTO } from '../../dtos/check-scam-request.dto';
import { Router, RouterModule } from '@angular/router'; 
import { HeaderComponent } from '../../components/header/header.component'; 
import { FooterComponent } from '../../components/footer/footer.component'; 
import { ChatBoxComponent } from '../../components/chat-box/chat-box.component'; 
import { TopScamService, TopScamItem } from '../../services/top-scam.service';
import { VerticalBannerComponent } from './vertical-banner/vertical-banner.component';
import { ActivityWidgetComponent } from '../activity-widget/activity-widget.component';
import { Title, Meta } from '@angular/platform-browser'; 

interface ScamDetail {
  id: number;
  info: string;
  name: string;
  description: string;
  evidenceImages: string[];
  totalScamAmount: number;
  reportCount: number;
  lastReportDate: string;
  status: 'danger' | 'warning' | 'safe';
  type: 'phone' | 'bank' | 'url';
}

interface SearchApiResponse {
  info: string;
  type: number;
  description: string;
  reportDescription: string;
  moneyScam: string;
  dateReport: string | null;
  verifiedCount: number;
  lastReportAt: string;
  evidenceURLs: string[]; 
  analysis: string; 

}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  isUser: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    ChatBoxComponent,
    VerticalBannerComponent,
    ActivityWidgetComponent

  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {

  info: string = '';
  selectedType: number = 1;
  currentSearchIcon: string = 'fas fa-mobile-alt';
  
  isLoading: boolean = false;
  errorMessage: string | null = null;

  // 🔧 TIMEOUT để tránh loading vĩnh viễn
  private loadingTimeout: any;
  private readonly LOADING_TIMEOUT = 30000; // 30 seconds

  messages: Message[] = [];
  showChatbox: boolean = false;

  phoneNumbers: TopScamItem[] = [];
  bankAccounts: TopScamItem[] = [];
  websites: TopScamItem[] = [];
  isLoadingTopData: boolean = false;
  topDataError: string | null = null;

  showDetailModal: boolean = false;
  selectedScamDetail: ScamDetail | null = null;
  isLoadingDetail: boolean = false;

  mockScamDetails: { [key: string]: ScamDetail } = {
    '0346304549': {
      id: 1,
      info: '0346304549',
      name: 'Trịnh Công Minh',
      description: 'Giả danh nhân viên ngân hàng để lừa đảo vay tiền online với lãi suất thấp. Thường liên hệ vào giờ hành chính, nói chuyện rất thuyết phục và có kiến thức chuyên môn.',
      evidenceImages: [
        'https://via.placeholder.com/400x300?text=B%E1%BA%B1ng+ch%E1%BB%A9ng+1',
        'https://via.placeholder.com/400x300?text=Tin+nh%E1%BA%AFn+l%E1%BB%ABa+%C4%91%E1%BA%A3o',
        'https://via.placeholder.com/400x300?text=Screenshot+website+gi%E1%BA%A3'
      ],
      totalScamAmount: 15420000,
      reportCount: 127,
      lastReportDate: '2024-12-15T10:30:00',
      status: 'danger',
      type: 'phone'
    },
    '0336970084': {
      id: 2,
      info: '0336970084',
      name: 'Nguyễn Huy Tùng',
      description: 'Tự xưng là nhân viên của sàn thương mại điện tử, gọi điện quảng cáo sản phẩm giả và đòi hỏi thanh toán trước. Đã lừa nhiều nạn nhân.',
      evidenceImages: [
        'https://via.placeholder.com/400x300?text=Giao+di%E1%BB%87n+app+gi%E1%BA%A3',
        'https://via.placeholder.com/400x300?text=H%C3%B3a+%C4%91%C6%A1n+gi%E1%BA%A3'
      ],
      totalScamAmount: 8950000,
      reportCount: 89,
      lastReportDate: '2024-12-10T14:20:00',
      status: 'danger',
      type: 'phone'
    },
    '1020541389': {
      id: 3,
      info: '1020541389',
      name: 'Tài khoản Vietcombank giả',
      description: 'Tài khoản ngân hàng giả mạo Vietcombank, được sử dụng để nhận tiền từ các vụ lừa đảo mua bán online. Thường gửi QR code hoặc số tài khoản trực tiếp.',
      evidenceImages: [
        'https://via.placeholder.com/400x300?text=QR+code+gi%E1%BA%A3',
        'https://via.placeholder.com/400x300?text=Th%C3%B4ng+tin+t%C3%A0i+kho%E1%BA%A3n',
        'https://via.placeholder.com/400x300?text=L%E1%BB%8Bch+s%E1%BB%AD+giao+d%E1%BB%8Bch'
      ],
      totalScamAmount: 25600000,
      reportCount: 203,
      lastReportDate: '2024-12-18T09:15:00',
      status: 'danger',
      type: 'bank'
    },
    'zzuxzy.cn': {
      id: 4,
      info: 'zzuxzy.cn',
      name: 'Website thương mại điện tử giả',
      description: 'Website giả mạo các thương hiệu nổi tiếng, bán sản phẩm với giá rẻ bất thường. Sau khi nhận tiền sẽ không gửi hàng hoặc gửi hàng giả.',
      evidenceImages: [
        'https://via.placeholder.com/400x300?text=Giao+di%E1%BB%87n+website',
        'https://via.placeholder.com/400x300?text=S%E1%BA%A3n+ph%E1%BA%A9m+gi%E1%BA%A3',
        'https://via.placeholder.com/400x300?text=Th%C3%B4ng+b%C3%A1o+c%E1%BA%A3nh+b%C3%A1o'
      ],
      totalScamAmount: 12300000,
      reportCount: 156,
      lastReportDate: '2024-12-12T16:45:00',
      status: 'danger',
      type: 'url'
    }
  };

  activeTab: string = 'phone';

searchResult: any;

  constructor(
    private CheckScamService: CheckScamService,
    private router: Router, 
    private topScamService: TopScamService,
    private titleService: Title, // Inject Title service
    private metaService: Meta // Inject Meta service
  ) { }

  ngOnInit(): void {
    // 🔧 FORCE RESET LOADING STATE khi component khởi tạo
    this.forceResetLoadingState();
    
    this.updateSearchIcon();
    this.loadTopScamData();
    this.setSeoTags(); // Gọi phương thức đặt SEO tags

    // 🔧 DEBUG: Kiểm tra loading state
    console.log('🔍 Component initialized. Loading state:', this.isLoading);
  }

  ngOnDestroy(): void {
    // 🔧 CLEANUP: Đảm bảo clear timeout và reset state khi component bị destroy
    this.clearLoadingTimeout();
    this.forceResetLoadingState();
  }

  // 🔧 FORCE RESET LOADING STATE
  private forceResetLoadingState(): void {
    console.log('🔧 Force resetting loading state...');
    this.isLoading = false;
    this.clearLoadingTimeout();
    
    // Remove loading class from body nếu có
    if (document.body.classList.contains('loading-active')) {
      document.body.classList.remove('loading-active');
      console.log('✅ Removed loading-active class from body');
    }
    
    // Force change detection
    setTimeout(() => {
      this.isLoading = false;
      console.log('🔍 Final loading state after reset:', this.isLoading);
    }, 100); // Tăng từ 0 lên 100ms
  }

  // 🔧 SET LOADING TIMEOUT
  private setLoadingTimeout(): void {
    this.clearLoadingTimeout();
    this.loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Loading timeout reached! Force stopping loading...');
      this.forceStopLoading('Thời gian chờ quá lâu. Vui lòng thử lại.');
    }, this.LOADING_TIMEOUT);
  }

  // 🔧 CLEAR LOADING TIMEOUT
  private clearLoadingTimeout(): void {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
  }

  // 🔧 FORCE STOP LOADING
  private forceStopLoading(errorMsg?: string): void {
    console.log('🛑 Force stopping loading...');
    this.isLoading = false;
    this.clearLoadingTimeout();
    
    // Remove loading class from body
    document.body.classList.remove('loading-active');
    
    if (errorMsg) {
      this.errorMessage = errorMsg;
    }
    
    console.log('✅ Loading stopped successfully');
  }

  // Phương thức mới để đặt Title và Meta Description
  private setSeoTags(): void {
    this.titleService.setTitle('AI6 - Săn Người Xấu, Diệt Kẻ Gian | Phát Hiện Lừa Đảo AI');
    this.metaService.addTags([
      { name: 'description', content: 'AI6 - Săn Người Xấu, Diệt Kẻ Gian sử dụng AI phân tích lừa đảo qua số điện thoại, tài khoản, URL. Duyệt web an toàn, giao dịch minh bạch dữ liệu được lấy từ nguồn uy tín như Bộ Công An và các báo cáo có bằng chứng từ cộng đồng.' },
      { name: 'keywords', content: 'AI6, săn người xấu, diệt kẻ gian, phát hiện lừa đảo, lừa đảo AI, số điện thoại lừa đảo, tài khoản ngân hàng lừa đảo, website lừa đảo, Bộ Công An, báo cáo lừa đảo, an toàn trực tuyến' },
      { property: 'og:title', content: 'AI6 - Săn Người Xấu, Diệt Kẻ Gian | Phát Hiện Lừa Đảo AI' },
      { property: 'og:description', content: 'AI6 - Săn Người Xấu, Diệt Kẻ Gian sử dụng AI phân tích lừa đảo qua số điện thoại, tài khoản, URL. Duyệt web an toàn, giao dịch minh bạch dữ liệu được lấy từ nguồn uy tín như Bộ Công An và các báo cáo có bằng chứng từ cộng đồng.' },
      { property: 'og:url', content: 'https://your-domain.com/' }, // Thay thế bằng URL thực tế của trang Home
      { property: 'og:type', content: 'website' },
      // Thêm các meta tag khác nếu cần, ví dụ: og:image, twitter:card, etc.
    ]);
  }

  selectSearchType(type: number): void {
    this.selectedType = type;
    this.updateSearchIcon();
    this.info = '';
    this.errorMessage = null;
  }

  getSearchPlaceholder(): string {
    switch (this.selectedType) {
      case 1: 
        return 'Ví dụ: 0123456789';
      case 2: 
        return 'Ví dụ: 1234567890';
      case 3: 
        return 'Ví dụ: https://example.com';
      default: 
        return 'Nhập thông tin cần kiểm tra...';
    }
  }

  updateSearchIcon(): void {
    switch (this.selectedType) {
      case 1:
        this.currentSearchIcon = 'fas fa-mobile-alt';
        break;
      case 2:
        this.currentSearchIcon = 'fas fa-university';
        break;
      case 3:
        this.currentSearchIcon = 'fas fa-globe';
        break;
      default:
        this.currentSearchIcon = 'fas fa-question-circle';
    }
  }

  // 🔧 IMPROVED SEND MESSAGE WITH BETTER ERROR HANDLING
  sendMessage(): void {
    const value = this.info.trim();
    if (!value) {
      this.showValidationError('⚠️ Vui lòng nhập thông tin cần tra cứu.');
      return;
    }

    // 🔧 ENHANCED VALIDATION WITH DETAILED MESSAGES
    if (this.selectedType === 1) {
      const phoneValidation = this.validatePhoneNumber(value);
      if (!phoneValidation.isValid) {
        this.showValidationError(phoneValidation.message);
        return;
      }
    }
    
    if (this.selectedType === 2) {
      const bankValidation = this.validateBankNumber(value);
      if (!bankValidation.isValid) {
        this.showValidationError(bankValidation.message);
        return;
      }
    }
    
    if (this.selectedType === 3) {
      const urlValidation = this.validateUrl(value);
      if (!urlValidation.isValid) {
        this.showValidationError(urlValidation.message);
        return;
      }
    }

    // 🔧 START LOADING WITH TIMEOUT
    console.log('🚀 Starting search with improved error handling...');
    this.errorMessage = null;
    this.isLoading = true;
    
    // Set timeout to prevent infinite loading
    this.setLoadingTimeout();
    
    // Lock body scroll khi loading - NHẸ HẠN
    document.body.classList.add('loading-active');
    
    // 🔧 DEBUG: Log loading state
    console.log('🔍 Loading started. State:', {
      isLoading: this.isLoading,
      value: value,
      type: this.selectedType
    });

    const requestBody: CheckScamRequestDTO = {
      info: value,
      type: this.selectedType
    };

    // 🔧 API CALL WITH IMPROVED ERROR HANDLING
    this.CheckScamService.CheckScam(requestBody).subscribe({
      next: (response) => {
        console.log('✅ API call successful:', response);
        this.forceStopLoading();
        
        if (response && response.info) {
          this.router.navigate(['/analyze'], {
            state: {
              result: response,
              type: this.selectedType,
              info: value
            }
          });
        } else {
          this.showValidationError('❌ Cấu trúc phản hồi từ máy chủ không hợp lệ.');
        }
      },
      error: (error) => {
        console.error('❌ API call failed:', error);
        this.forceStopLoading();
        
        this.showValidationError(error?.error?.message || error?.message || '❌ Đã xảy ra lỗi khi tra cứu.');
      }
    });
    
    this.info = '';
  }

  private isPhoneNumber(value: string): boolean {
    return /^0\d{9}$/.test(value.trim());
  }

  private isBankNumber(value: string): boolean {
    return /^\d+$/.test(value.trim());
  }

  private isUrl(value: string): boolean {
    const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    return urlRegex.test(value.trim());
  }

  onAiTuVanClicked() {
    this.showChatbox = true;
  }

  closeChatbox() {
    this.showChatbox = false;
  }

  onRobotClick(): void {
    const actions = [
      () => this.showRobotMessage('🤖 Xin chào! Tôi là Robot CheckScam! Chân tôi có nhanh không?'),
      () => this.showRobotMessage('🛡️ Đang tuần tra bảo vệ bạn khỏi lừa đảo nè!'),
      () => this.showRobotMessage('⚡ Tôi chạy quanh đây để kiểm tra thông tin cho bạn!'),
      () => this.showRobotMessage('🔍 Hãy nhập thông tin vào ô tìm kiếm để tôi giúp bạn!'),
      () => this.showRobotMessage('🏃‍♂️ Tôi có thể chạy nhanh hơn! Xem chân tôi đạp thế nào!'),
      () => this.showRobotMessage('🚀 Bạn muốn xem tôi chạy TURBO không?'),
      () => this.showRobotMessage('🤖 Chân robot của tôi hoạt động bằng AI tiên tiến!'),
      () => this.showRobotMessage('👁️ Tôi chớp mắt để giữ cho bạn thấy cute!'),
      () => this.speedUpRobot()
    ];
    
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    randomAction();
  }

  private showRobotMessage(message: string): void {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = message;
    messageElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(45deg, #FF6B35, #FF8A65);
      color: white;
      padding: 15px 20px;
      border-radius: 20px;
      font-weight: 600;
      box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
      z-index: 10000;
      animation: fadeInOut 3s ease-in-out;
      max-width: 300px;
      text-align: center;
    `;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 3000);
  }

  private speedUpRobot(): void {
    const robot = document.querySelector('.search-robot') as HTMLElement;
    if (robot) {
      robot.style.animationDuration = '3s';
      robot.classList.add('turbo');
      this.showRobotMessage('🚀 TURBO MODE ACTIVATED! Chân robot đang chạy siêu nhanh!');
      
      setTimeout(() => {
        robot.style.animationDuration = '10s';
        robot.classList.remove('turbo');
      }, 5000);
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'phone': return 'fas fa-mobile-alt';
      case 'bank': return 'fas fa-university';
      case 'url': return 'fas fa-globe';
      default: return 'fas fa-question-circle';
    }
  }

  getTypeName(type: string): string {
    switch (type) {
      case 'phone': return 'Điện thoại';
      case 'bank': return 'Tài khoản';
      case 'url': return 'Website';
      default: return 'Khác';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'danger': return 'Nguy hiểm';
      case 'warning': return 'Cảnh báo';
      case 'safe': return 'An toàn';
      default: return 'Chưa rõ';
    }
  }

  // Tab management methods
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Load data từ backend
  loadTopScamData(): void {
    this.isLoadingTopData = true;
    this.topDataError = null;

    // Load tất cả dữ liệu từ backend
    this.topScamService.getTopAll().subscribe({
      next: (response) => {
        if (response && response.status === 'OK' && response.data) {
          // Dựa vào cấu trúc API response từ document
          this.phoneNumbers = response.data.phones || [];
          this.bankAccounts = response.data.banks || [];
          this.websites = response.data.urls || [];
        } else {
          this.loadIndividualData(); // Fallback to individual API calls
        }
        this.isLoadingTopData = false;
      },
      error: (error) => {

        this.loadIndividualData(); // Fallback to individual API calls
      }
    });
  }

  // Fallback method để load từng loại dữ liệu riêng
  private loadIndividualData(): void {
    // Load phones
    this.topScamService.getTopPhones().subscribe({
      next: (response) => {
        if (response && response.status === 'OK') {
          this.phoneNumbers = response.data || [];

        }
      },
      error: (error) => {

        this.topDataError = 'Không thể tải dữ liệu số điện thoại';
      }
    });

    // Load banks
    this.topScamService.getTopBanks().subscribe({
      next: (response) => {
        if (response && response.status === 'OK') {
          this.bankAccounts = response.data || [];

        }
      },
      error: (error) => {

        this.topDataError = 'Không thể tải dữ liệu tài khoản ngân hàng';
      }
    });

    // Load URLs
    this.topScamService.getTopUrls().subscribe({
      next: (response) => {
        if (response && response.status === 'OK') {
          this.websites = response.data || [];

        }
      },
      error: (error) => {

        this.topDataError = 'Không thể tải dữ liệu website';
      }
    });

    this.isLoadingTopData = false;
  }

  getPhoneNumbers(): TopScamItem[] {
    return this.phoneNumbers;
  }

  getBankAccounts(): TopScamItem[] {
    return this.bankAccounts;
  }

  getWebsites(): TopScamItem[] {
    return this.websites;
  }

  onItemClick(item: TopScamItem): void {
    let type = 1; 
    if (item.type === 'phone') type = 1;
    else if (item.type === 'bank') type = 2;
    else if (item.type === 'url') type = 3;
    
    this.router.navigate(['/subject-detail', item.info], {
      queryParams: { type: type }
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedScamDetail = null;
    this.isLoadingDetail = false;
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

  openMmoLink(): void {
    window.open('https://mmoidai.io.vn', '_blank');
  }

  openPartnerPopup(): void {
    // Tạo popup đơn giản hoặc mở link liên hệ
    const email = 'partner@ai6.vn';
    const subject = 'Đăng ký đối tác quảng cáo';
    const body = 'Xin chào,\n\nTôi muốn tìm hiểu về việc đặt banner quảng cáo trên ai6.vn.\n\nVui lòng liên hệ lại để trao đổi chi tiết.\n\nCảm ơn!';
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  }

  // 🔧 VALIDATION METHODS
  private showValidationError(message: string): void {
    this.errorMessage = message;
    // Tự động ẩn error sau 5 giây
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = null;
      }
    }, 5000);
  }

  private validatePhoneNumber(phone: string): { isValid: boolean; message: string } {
    const cleanPhone = phone.trim();
    
    if (cleanPhone.length === 0) {
      return { isValid: false, message: '📱 Vui lòng nhập số điện thoại.' };
    }
    
    // Loại bỏ các ký tự không phải số
    const phoneNumbers = cleanPhone.replace(/[^0-9]/g, '');
    
    // Kiểm tra độ dài
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      return { isValid: false, message: '📱 Số điện thoại phải có 10-11 chữ số.' };
    }
    
    // Kiểm tra định dạng Việt Nam cho số 10 chữ số (phải bắt đầu bằng 0)
    if (phoneNumbers.length === 10 && !phoneNumbers.startsWith('0')) {
      return { isValid: false, message: '📱 Số điện thoại 10 chữ số phải bắt đầu bằng số 0.' };
    }
    
    // Kiểm tra định dạng Việt Nam cho số 11 chữ số (phải bắt đầu bằng +84 hoặc 84)
    if (phoneNumbers.length === 11) {
      if (!phoneNumbers.startsWith('84')) {
        return { isValid: false, message: '📱 Số điện thoại 11 chữ số phải bắt đầu bằng 84.' };
      }
      // Chuyển đổi từ +84 format sang 0 format để kiểm tra đầu số
      const convertedPhone = '0' + phoneNumbers.substring(2);
      const prefix = convertedPhone.substring(0, 3);
      
      const validPrefixes = ['032', '033', '034', '035', '036', '037', '038', '039', // Viettel
                            '070', '079', '077', '076', '078', // Mobifone
                            '083', '084', '085', '081', '082', // Vinaphone
                            '056', '058', // Vietnamobile
                            '059', '099'] // Gmobile
      
      if (!validPrefixes.includes(prefix)) {
        return { isValid: false, message: '📱 Đầu số điện thoại không hợp lệ (sau 84).' };
      }
    } else {
      // Kiểm tra các đầu số hợp lệ cho số 10 chữ số
      const validPrefixes = ['032', '033', '034', '035', '036', '037', '038', '039', // Viettel
                            '070', '079', '077', '076', '078', // Mobifone
                            '083', '084', '085', '081', '082', // Vinaphone
                            '056', '058', // Vietnamobile
                            '059', '099'] // Gmobile
      
      const prefix = phoneNumbers.substring(0, 3);
      if (!validPrefixes.includes(prefix)) {
        return { isValid: false, message: '📱 Đầu số điện thoại không hợp lệ.' };
      }
    }
    
    return { isValid: true, message: '' };
  }

  private validateBankNumber(bankNumber: string): { isValid: boolean; message: string } {
    const cleanBankNumber = bankNumber.trim();
    
    if (cleanBankNumber.length === 0) {
      return { isValid: false, message: '🏦 Vui lòng nhập số tài khoản ngân hàng.' };
    }
    
    // Loại bỏ các ký tự không phải số
    const numbers = cleanBankNumber.replace(/[^0-9]/g, '');
    
    // Kiểm tra độ dài (thông thường từ 8-19 chữ số)
    if (numbers.length < 8 || numbers.length > 19) {
      return { isValid: false, message: '🏦 Số tài khoản phải có từ 8-19 chữ số.' };
    }
    
    // Kiểm tra không được toàn bộ là số 0
    if (numbers === '0'.repeat(numbers.length)) {
      return { isValid: false, message: '🏦 Số tài khoản không hợp lệ.' };
    }
    
    return { isValid: true, message: '' };
  }

  private validateUrl(url: string): { isValid: boolean; message: string } {
    const cleanUrl = url.trim();
    
    if (cleanUrl.length === 0) {
      return { isValid: false, message: '🌐 Vui lòng nhập URL website.' };
    }
    
    // Kiểm tra không được toàn bộ là số
    if (/^\d+$/.test(cleanUrl)) {
      return { isValid: false, message: '🌐 URL không được chỉ là số.' };
    }
    
    try {
      // Thêm protocol nếu thiếu
      let testUrl = cleanUrl;
      if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
        testUrl = 'https://' + testUrl;
      }
      
      const urlObj = new URL(testUrl);
      
      // Kiểm tra hostname có hợp lệ không
      if (!urlObj.hostname || urlObj.hostname.length < 3) {
        return { isValid: false, message: '🌐 URL không hợp lệ.' };
      }
      
      // Kiểm tra không được toàn bộ hostname là số
      if (/^\d+$/.test(urlObj.hostname)) {
        return { isValid: false, message: '🌐 Domain không được chỉ là số.' };
      }
      
      // Kiểm tra có ít nhất một dấu chấm trong hostname
      if (!urlObj.hostname.includes('.')) {
        return { isValid: false, message: '🌐 URL phải có định dạng domain hợp lệ (VD: example.com).' };
      }
      
      // Kiểm tra domain extension hợp lệ
      const parts = urlObj.hostname.split('.');
      const extension = parts[parts.length - 1];
      
      // Extension phải có ít nhất 2 ký tự và không được là số
      if (extension.length < 2 || /^\d+$/.test(extension)) {
        return { isValid: false, message: '🌐 Domain extension không hợp lệ (VD: .com, .vn).' };
      }
      
      // Kiểm tra các ký tự hợp lệ trong domain
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!domainRegex.test(urlObj.hostname)) {
        return { isValid: false, message: '🌐 Domain chứa ký tự không hợp lệ.' };
      }
      
      return { isValid: true, message: '' };
    } catch (error) {
      return { isValid: false, message: '🌐 URL không đúng định dạng.' };
    }
  }
}