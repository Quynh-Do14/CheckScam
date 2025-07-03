import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

// Import HeaderComponent and FooterComponent
import { HeaderComponent } from '../header/header.component'; // Điều chỉnh đường dẫn nếu cần
import { FooterComponent } from '../footer/footer.component'; // Điều chỉnh đường dẫn nếu cần

// Define an interface for your form data
interface PartnershipFormData {
  name: string;
  email: string;
  phone: string;
  partnershipType: string;
  message: string;
}

@Component({
  selector: 'app-partners',
  standalone: true, // This component is standalone
  imports: [
    CommonModule,
    FormsModule, // Required for ngModel
    HeaderComponent, // Import HeaderComponent
    FooterComponent  // Import FooterComponent
  ],
  templateUrl: './partners.component.html',
  styleUrls: ['./partners.component.scss']
})
export class PartnersComponent implements OnInit {

  // Initialize form data with default empty values
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

  // Function to scroll to the contact section (still useful)
  scrollToContact(): void {
    document.getElementById('contactSection')?.scrollIntoView({ behavior: 'smooth' });
  }

  // Function to handle form submission
  submitPartnershipForm(): void {
    if (this.isFormValid()) {
      // In a real application, you would send this data to a backend service.
      // Example: this.partnershipService.sendProposal(this.partnershipData).subscribe(...)

      console.log('Partnership Proposal Submitted:', this.partnershipData);

      // Show success toast
      this.toastr.success('Đề xuất hợp tác của bạn đã được gửi thành công!', 'Thành công!');

      // Reset the form after submission
      this.partnershipData = {
        name: '',
        email: '',
        phone: '',
        partnershipType: '',
        message: ''
      };
    } else {
      // Show error toast if form is invalid (though button is disabled if invalid)
      this.toastr.error('Vui lòng điền đầy đủ và chính xác thông tin!', 'Lỗi');
    }
  }

  // Basic form validation (can be enhanced with Angular's Validators if using Reactive Forms)
  isFormValid(): boolean {
    return !!this.partnershipData.name &&
           !!this.partnershipData.email &&
           this.isValidEmail(this.partnershipData.email) &&
           !!this.partnershipData.message;
  }

  // Simple email validation regex
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}