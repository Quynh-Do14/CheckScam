import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vertical-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="vertical-banner" [ngClass]="{'left-banner': position === 'left', 'right-banner': position === 'right'}">
      <div class="banner-card" [ngStyle]="getCardStyle()">
        <!-- Header -->
        <div class="banner-header" [ngStyle]="getHeaderStyle()">
          <div class="banner-icon">
            <i class="fa fa-star"></i>
          </div>
          <div class="banner-title-small">Cơ Hội Vàng</div>
          <div class="banner-title-main">ĐỐI TÁC CHIẾN LƯỢC</div>
        </div>

        <!-- Main Content -->
        <div class="banner-content" [ngStyle]="getContentStyle()">
          <div class="content-text">
            <div class="main-message">HÃY LIÊN HỆ</div>
            <div class="main-message">ĐẶT BANNER QUẢNG CÁO</div>
            
            <div class="divider"></div>
            
            <div class="main-message">TRỞ THÀNH ĐỐI TÁC</div>
            <div class="main-message">UY TÍN HÀNG ĐẦU</div>
          </div>

          <!-- Button -->
          <div class="button-container">
            <button 
              class="contact-button" 
              [ngStyle]="getButtonStyle()"
              (mouseenter)="onButtonHover(true)"
              (mouseleave)="onButtonHover(false)"
              (mousedown)="onButtonPress(true)"
              (mouseup)="onButtonPress(false)">
              {{ getButtonText() }}
            </button>
          </div>

          <!-- Contact Info -->
          <div class="contact-card" [ngStyle]="getContactCardStyle()">
            <div class="contact-item">
              <i class="fa fa-phone"></i>
              <span>0123.456.789</span>
            </div>
            
            <div class="contact-item">
              <i class="fa fa-envelope"></i>
              <span>partner&#64;company.vn</span>
            </div>
            
            <div class="contact-item">
              <i class="fa fa-map-marker"></i>
              <span>Địa chỉ công ty</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./vertical-banner.component.scss']
})
export class VerticalBannerComponent implements OnInit, OnDestroy {
  @Input() position: 'left' | 'right' = 'left';

  screenSize = { width: 0, isMobile: false, isSmall: false };
  isButtonHovered = false;
  isButtonPressed = false;

  ngOnInit() {
    this.updateScreenSize();
  }

  ngOnDestroy() {
    // Clean up if needed
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updateScreenSize();
  }

  private updateScreenSize() {
    const width = window.innerWidth;
    this.screenSize = {
      width,
      isMobile: width <= 768,
      isSmall: width <= 480
    };
  }

  getButtonText(): string {
    if (this.screenSize.isSmall) return "LIÊN HỆ";
    if (this.screenSize.isMobile) return "LIÊN HỆ NGAY";
    return "LIÊN HỆ NGAY";
  }

  getCardStyle() {
    return {
      'background': 'linear-gradient(135deg, #fef4e7 0%, #fed7aa 30%, #fdba74 60%, #fb923c 100%)',
      'border': '1px solid rgba(251, 146, 60, 0.2)',
      'border-radius': '16px',
      'box-shadow': '0 4px 16px rgba(251, 146, 60, 0.15)',
      'height': '100%',
      'min-height': '600px'
    };
  }

  getHeaderStyle() {
    return {
      'background': 'linear-gradient(135deg, #fef4e7 0%, #fed7aa 50%, #fdba74 100%)',
      'border-radius': '16px 16px 0 0',
      'padding': '16px',
      'text-align': 'center'
    };
  }

  getContentStyle() {
    return {
      'background': 'linear-gradient(135deg, #fffbf5 0%, #fef4e7 25%, #fff 100%)',
      'padding': '20px',
      'flex': '1',
      'display': 'flex',
      'flex-direction': 'column',
      'justify-content': 'center'
    };
  }

  getButtonStyle() {
    const baseStyle = {
      'background': this.isButtonHovered 
        ? 'linear-gradient(135deg, #ea580c 0%, #d97706 50%, #c2410c 100%)'
        : 'linear-gradient(135deg, #fb923c 0%, #ea580c 50%, #d97706 100%)',
      'border': 'none',
      'border-radius': '8px',
      'color': '#ffffff',
      'font-size': this.screenSize.isSmall ? '9px' : this.screenSize.isMobile ? '10px' : '12px',
      'height': this.screenSize.isSmall ? '36px' : this.screenSize.isMobile ? '40px' : '48px',
      'padding': '0 20px',
      'min-width': this.screenSize.isSmall ? '100px' : '140px',
      'max-width': this.screenSize.isSmall ? '140px' : '160px',
      'width': 'auto',
      'font-weight': 'bold',
      'letter-spacing': '0.8px',
      'font-family': '"Inter", sans-serif',
      'cursor': 'pointer',
      'transition': 'all 0.3s ease',
      'box-shadow': this.isButtonHovered 
        ? '0 4px 16px rgba(251, 146, 60, 0.3)'
        : '0 2px 8px rgba(251, 146, 60, 0.25)',
      'text-transform': 'uppercase',
      'transform': this.isButtonHovered 
        ? (this.isButtonPressed ? 'translateY(0)' : 'translateY(-2px)')
        : 'translateY(0)'
    };

    return baseStyle;
  }

  getContactCardStyle() {
    return {
      'background': 'linear-gradient(135deg, #fafafa 0%, #ffffff 50%, #fef4e7 100%)',
      'border': '1px solid rgba(251, 146, 60, 0.15)',
      'border-radius': '8px',
      'margin-top': '12px',
      'max-width': '180px',
      'margin': '12px auto 0 auto',
      'padding': '8px'
    };
  }

  onButtonHover(isHovered: boolean) {
    this.isButtonHovered = isHovered;
  }

  onButtonPress(isPressed: boolean) {
    this.isButtonPressed = isPressed;
  }
}
