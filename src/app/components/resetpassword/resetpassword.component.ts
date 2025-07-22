import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Title } from '@angular/platform-browser'; // Thêm import Title service

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './resetpassword.component.html',
  styleUrls: ['./resetpassword.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  token: string | null = null;
  isLoading: boolean = false;
  // Loại bỏ successMessage và errorMessage ở đây để dùng chung notification
  // successMessage: string | null = null;
  // errorMessage: string | null = null;

  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  showNotification: boolean = false;
  notificationMessage: string = '';
  notificationType: 'success' | 'error' | 'info' = 'info';
  notificationTimeout: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private titleService: Title // Inject Title service
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('AI6 - Đặt lại mật khẩu'); // Đặt tiêu đề cho tab trình duyệt

    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        // Chỉ hiển thị thông báo lỗi này nếu không có token ngay từ đầu
        this.showAppNotification(
          'Không tìm thấy mã đặt lại mật khẩu trong URL. Vui lòng quay lại trang quên mật khẩu để yêu cầu lại.',
          'error'
        );
      }
    });

    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.resetPasswordForm.controls;
  }

  passwordMatchValidator: ValidatorFn = (control: AbstractControl): { [key: string]: boolean } | null => {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    // Nếu một trong hai trường không tồn tại hoặc giá trị trùng khớp, không có lỗi
    if (!newPassword || !confirmPassword || newPassword.value === confirmPassword.value) {
      // Đảm bảo không còn lỗi 'mismatch' nếu trước đó có và giờ đã khớp
      if (confirmPassword && confirmPassword.errors && confirmPassword.errors['mismatch']) {
        delete confirmPassword.errors['mismatch'];
        confirmPassword.updateValueAndValidity({ emitEvent: false }); // Cập nhật trạng thái mà không gây vòng lặp
      }
      return null;
    }

    // Đặt lỗi 'mismatch' cho trường confirmPassword
    confirmPassword.setErrors({ ...confirmPassword.errors, mismatch: true });
    return { mismatch: true };
  };

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

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.isLoading = true;
    this.closeNotification(); // Đóng notification cũ trước khi gửi yêu cầu mới

    if (!this.token) {
      // Nếu không có token, đã có thông báo lỗi từ ngOnInit, chỉ cần tắt loading
      this.isLoading = false;
      return;
    }

    // Kiểm tra tính hợp lệ của form (bao gồm cả validator mật khẩu khớp)
    if (this.resetPasswordForm.invalid) {
      this.showAppNotification('Vui lòng điền đầy đủ và chính xác các thông tin mật khẩu.', 'error');
      this.resetPasswordForm.markAllAsTouched(); // Đánh dấu tất cả để hiển thị lỗi ngay
      this.isLoading = false;
      return;
    }

    const { newPassword } = this.resetPasswordForm.value;

    this.userService.resetPassword(this.token, newPassword).subscribe({
      next: (response) => {
        this.showAppNotification(
          response.message || 'Mật khẩu của bạn đã được đặt lại thành công! Bạn sẽ được chuyển hướng về trang đăng nhập sau 3 giây.',
          'success'
        );
        this.resetPasswordForm.reset(); // Xóa form sau khi thành công
        console.log('Reset password success response:', response);
        // Chuyển hướng về trang đăng nhập sau 3 giây
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.showAppNotification(
          err.error?.message || err.message || 'Đã xảy ra lỗi không xác định khi đặt lại mật khẩu. Vui lòng thử lại.',
          'error'
        );
        console.error('Reset password error:', err);
      }
    }).add(() => {
      this.isLoading = false; // Luôn tắt trạng thái loading
    });
  }
}