import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Title } from '@angular/platform-browser';

import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ChatBoxComponent } from '../chat-box/chat-box.component';

export interface PartnerInfo {
  companyName: string;
  description: string;
  services: string[];
  benefits: string[];
}

export interface ContactForm {
  name: string;
  email: string;
  company: string;
  phone: string;
  inquiryType: string;
  message: string;
}

export interface StatItem {
  number: string;
  label: string;
}

@Component({
  selector: 'app-partners',
  standalone: true, 
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    ChatBoxComponent
  ],
  templateUrl: './partners.component.html',
  styleUrls: [
    './partners.component.scss',
    './robot-static.scss'  // Override to make robot completely static
  ]
})
export class PartnersComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('heroTitle', { static: false }) heroTitle!: ElementRef;
  
  showChatbox = false;
  isModalOpen = false;
  currentStep = 'contact';
  selectedInquiryType = 'partnership';
  isSubmitting = false;
  private intersectionObserver!: IntersectionObserver;
  
  // Partner data
  partnerInfo: PartnerInfo = {
    companyName: 'AI6 Partners',
    description: 'Nền tảng kết nối đối tác chiến lược hàng đầu trong lĩnh vực AI và bảo mật thông tin',
    services: [
      'Phát triển giải pháp AI chống lừa đảo',
      'Tích hợp hệ thống bảo mật thông minh',
      'Tư vấn chuyển đổi số an toàn',
      'Đào tạo nhận biết và phòng chống lừa đảo'
    ],
    benefits: [
      'Tiếp cận công nghệ AI chống lừa đảo tiên tiến',
      'Hỗ trợ kỹ thuật và bảo mật 24/7',
      'Mô hình hợp tác linh hoạt và bền vững',
      'ROI cao với giải pháp bảo mật toàn diện'
    ]
  };

  // Contact form data
  contactForm: ContactForm = {
    name: '',
    email: '',
    company: '',
    phone: '',
    inquiryType: 'partnership',
    message: ''
  };

  // Statistics data
  stats: StatItem[] = [
    { number: '100+', label: 'Đối tác tin cậy' },
    { number: '500+', label: 'Dự án bảo mật' },
    { number: '99%', label: 'Độ chính xác AI' },
    { number: '7+', label: 'Năm kinh nghiệm' }
  ];

  constructor(private toastr: ToastrService, private titleService: Title) { }

  ngAfterViewInit(): void {
    this.initializeAnimations();
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  ngOnInit(): void {
  this.titleService.setTitle('Đối tác - AI6 Partnership Platform');
  }

  private initializeAnimations(): void {
    // Trigger hero title underline animation after component loads
    setTimeout(() => {
      if (this.heroTitle?.nativeElement) {
        this.heroTitle.nativeElement.classList.add('animate-underline');
      }
    }, 2000);
  }

  private setupIntersectionObserver(): void {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.3
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, options);

    // Observe elements with animate-in class
    setTimeout(() => {
      const animatedElements = document.querySelectorAll('.animate-in');
      animatedElements.forEach((el) => {
        this.intersectionObserver.observe(el);
      });
    }, 100);
  }

  openModal(): void {
    this.isModalOpen = true;
    this.currentStep = 'contact';
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.resetForm();
    this.isSubmitting = false;
  }

  onInquiryTypeChange(value: string): void {
    this.selectedInquiryType = value;
    this.contactForm.inquiryType = value;
  }

  submitContactForm(): void {
    if (this.isFormValid()) {
      this.isSubmitting = true;
      
      // Simulate API call with loading state
      setTimeout(() => {
        // Add success animation to submit button
        const submitBtn = document.querySelector('.submit-button');
        if (submitBtn) {
          submitBtn.classList.add('success-animation');
        }
        
        // Show success message with enhanced styling
        this.toastr.success(
          'Cảm ơn bạn đã gửi yêu cầu hợp tác. Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ.',
          'Thành công',
          {
            timeOut: 5000,
            progressBar: true,
            progressAnimation: 'increasing'
          }
        );
        
        this.isSubmitting = false;
        this.currentStep = 'success';
        
        // Remove success animation after delay
        setTimeout(() => {
          if (submitBtn) {
            submitBtn.classList.remove('success-animation');
          }
        }, 600);
      }, 1500); // Simulate network delay
    } else {
      this.toastr.error('Vui lòng điền đầy đủ thông tin bắt buộc', 'Lỗi');
    }
  }

  isFormValid(): boolean {
    return !!(this.contactForm.name && 
              this.contactForm.email && 
              this.contactForm.company && 
              this.contactForm.message);
  }

  resetForm(): void {
    this.contactForm = {
      name: '',
      email: '',
      company: '',
      phone: '',
      inquiryType: 'partnership',
      message: ''
    };
    this.selectedInquiryType = 'partnership';
    this.isSubmitting = false;
  }

  // Enhanced methods for better UX
  onStatItemClick(stat: StatItem): void {
    // Add click feedback for stats
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
      statsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onServiceCardHover(index: number): void {
    // Optional: Add hover effects or sound feedback
    console.log(`Service card ${index + 1} hovered`);
  }

  addGradientTextEffect(elementClass: string): void {
    const elements = document.querySelectorAll(`.${elementClass}`);
    elements.forEach(el => {
      el.classList.add('gradient-text');
    });
  }

  triggerSuccessAnimation(element: HTMLElement): void {
    element.classList.add('success-animation');
    setTimeout(() => {
      element.classList.remove('success-animation');
    }, 600);
  }

  goToPartnerPortal(): void {
    window.open('https://partners.ai6.com', '_blank');
  }

  downloadPartnerKit(): void {
    this.toastr.info('Tài liệu đối tác đang được tải xuống...', 'Thông báo');
    // Implement actual download logic here
  }



  getCurrentReferenceCode(): string {
    return Date.now().toString().slice(-6);
  }

  // Enhanced form validation with visual feedback
  getFieldValidationClass(fieldName: keyof ContactForm): string {
    const field = this.contactForm[fieldName];
    if (!field && this.isSubmitting) {
      return 'error';
    }
    if (field) {
      return 'valid';
    }
    return '';
  }

  // Loading state helper
  getSubmitButtonText(): string {
    return this.isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu';
  }

  onAiTuVanClicked(): void {
    this.showChatbox = true;
  }

  closeChatbox(): void {
    this.showChatbox = false;
  }
}