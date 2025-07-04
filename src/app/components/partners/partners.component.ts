import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { HeaderComponent } from '../header/header.component'; 
import { FooterComponent } from '../footer/footer.component'; 
import { ChatBoxComponent } from '../chat-box/chat-box.component';

interface PartnershipFormData {
  name: string;
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
  partnershipData: PartnershipFormData = {
    name: '',
    email: '',
    phone: '',
    partnershipType: '',
    message: ''
  };

  constructor(private toastr: ToastrService) { }

  ngOnInit(): void {
  }

  scrollToContact(): void {
    document.getElementById('contactSection')?.scrollIntoView({ behavior: 'smooth' });
  }

  submitPartnershipForm(): void {
    if (this.isFormValid()) {

      console.log('Partnership Proposal Submitted:', this.partnershipData);

      this.toastr.success('Đề xuất hợp tác của bạn đã được gửi thành công!', 'Thành công!');

      this.partnershipData = {
        name: '',
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
    return !!this.partnershipData.name &&
           !!this.partnershipData.email &&
           this.isValidEmail(this.partnershipData.email) &&
           !!this.partnershipData.message;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

   /* ===== Chat ===== */
  onAiTuVanClicked(): void {
    debugger
    this.showChatbox = true;
  }

  closeChatbox(): void {
    debugger
    this.showChatbox = false;
  }
}