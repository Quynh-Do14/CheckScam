import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Title } from '@angular/platform-browser'; 

import { HeaderComponent } from '../header/header.component'; 
import { FooterComponent } from '../footer/footer.component'; 
import { ChatBoxComponent } from '../chat-box/chat-box.component';

interface PartnershipFormData {
  fullName: string; 
  companyName: string; 
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
  partnershipForm: PartnershipFormData = { 
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    partnershipType: '',
    message: ''
  };

  constructor(private toastr: ToastrService, private titleService: Title) { } 

  ngOnInit(): void {
    this.titleService.setTitle('Đối tác'); // Đặt tiêu đề cho tab trình duyệt
  }

  scrollToContact(): void {
    document.getElementById('contactSection')?.scrollIntoView({ behavior: 'smooth' });
  }

  submitPartnershipForm(): void {
    if (this.isFormValid()) {
      console.log('Partnership Proposal Submitted:', this.partnershipForm);
      this.toastr.success('Đề xuất hợp tác của bạn đã được gửi thành công!', 'Thành công!');

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
           !!this.partnershipForm.companyName &&
           !!this.partnershipForm.email &&
           this.isValidEmail(this.partnershipForm.email) &&
           !!this.partnershipForm.partnershipType &&
           !!this.partnershipForm.message;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onAiTuVanClicked(): void {
    this.showChatbox = true;
  }

  closeChatbox(): void {
    this.showChatbox = false;
  }
}