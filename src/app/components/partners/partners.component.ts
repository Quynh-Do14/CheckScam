import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { HeaderComponent } from '../header/header.component'; 
import { FooterComponent } from '../footer/footer.component'; 
import { ChatBoxComponent } from '../chat-box/chat-box.component';

interface PartnershipFormData {
  fullName: string; // Đổi từ 'name' thành 'fullName'
  companyName: string; // Thêm trường 'companyName'
  email: string;
  phone: string;
  partnershipType: string;
  message: string;
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
  styleUrls: ['./partners.component.scss']
})
export class PartnersComponent implements OnInit {
  showChatbox = false;
  partnershipForm: PartnershipFormData = { // Đổi tên từ 'partnershipData' thành 'partnershipForm' để khớp với ví dụ HTML trước đó
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    partnershipType: '',
    message: ''
  };

  constructor(private toastr: ToastrService) { }

  ngOnInit(): void {
  }

  // Bạn có thể bỏ phương thức này nếu không còn phần tử 'contactSection' để scroll tới
  // Hoặc bạn có thể thêm một ID 'contactSection' vào div .policy-section chứa form
  scrollToContact(): void {
    document.getElementById('contactSection')?.scrollIntoView({ behavior: 'smooth' });
  }

  submitPartnershipForm(): void {
    if (this.isFormValid()) {

      console.log('Partnership Proposal Submitted:', this.partnershipForm);

      this.toastr.success('Đề xuất hợp tác của bạn đã được gửi thành công!', 'Thành công!');

      // Reset form sau khi gửi thành công
      this.partnershipForm = {
        fullName: '',
        companyName: '',
        email: '',
        phone: '',
        partnershipType: '',
        message: ''
      };
    } else {
      this.toastr.error('Vui lòng điền đầy đủ và chính xác thông tin!', 'Lỗi');
    }
  }

  isFormValid(): boolean {
    return !!this.partnershipForm.fullName &&
           !!this.partnershipForm.companyName && // Thêm kiểm tra cho companyName
           !!this.partnershipForm.email &&
           this.isValidEmail(this.partnershipForm.email) &&
           !!this.partnershipForm.partnershipType && // Thêm kiểm tra cho partnershipType
           !!this.partnershipForm.message;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /* ===== Chat ===== */
  onAiTuVanClicked(): void {
    this.showChatbox = true;
  }

  closeChatbox(): void {
    this.showChatbox = false;
  }
}