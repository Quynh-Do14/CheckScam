import { Component, OnInit } from '@angular/core'; // Thêm OnInit
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { Router, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser'; // Thêm import Title service

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.scss']
})
export class ForgotPasswordComponent implements OnInit { // Triển khai OnInit
  email: string = '';
  isLoading: boolean = false;
  // Loại bỏ successMessage và errorMessage ở đây để dùng chung notification
  // successMessage: string | null = null;
  // errorMessage: string | null = null;

  showNotification: boolean = false;
  notificationMessage: string = '';
  notificationType: 'success' | 'error' | 'info' = 'info';
  notificationTimeout: any;

  constructor(
    private userService: UserService,
    private router: Router,
    private titleService: Title // Inject Title service
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('AI6 - Quên mật khẩu'); // Đặt tiêu đề cho tab trình duyệt
  }

  showAppNotification(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 5000): void {
    if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
    }

    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    this.notificationTimeout = setTimeout(() => {
        this.closeNotification();
    }, duration);
  }

  closeNotification(): void {
    this.showNotification = false;
    this.notificationMessage = '';
    if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
    }
  }

  onSubmit(): void {
    this.isLoading = true;
    this.closeNotification(); // Đóng notification cũ trước khi gửi yêu cầu mới

    this.userService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.showAppNotification(
          response.message || 'Một email đặt lại mật khẩu đã được gửi đến địa chỉ của bạn (nếu tài khoản tồn tại). Vui lòng kiểm tra hộp thư đến và cả thư mục spam.',
          'success'
        );
        console.log('Forgot password success response:', response);
      },
      error: (err) => {
        this.showAppNotification(
          err.error?.message || err.message || 'Đã xảy ra lỗi không xác định khi gửi yêu cầu. Vui lòng thử lại sau.',
          'error'
        );
        console.error('Forgot password error:', err);
      }
    }).add(() => {
      this.isLoading = false;
    });
  }
}