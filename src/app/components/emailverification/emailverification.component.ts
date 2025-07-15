import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { take } from 'rxjs/operators';
import { CommonModule, NgIf, NgClass } from '@angular/common';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-emailverification',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './emailverification.component.html',
  styleUrls: ['./emailverification.component.scss']
})
export class EmailVerificationComponent implements OnInit, OnDestroy {
  verificationStatus: string = '';
  errorMessage: string | null = null;
  isVerified: boolean = false;
  isLoaded: boolean = false;
  countdown: number = 5;
  private countdownSubscription: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.verificationStatus = 'Đang xác minh tài khoản của bạn...';
    this.errorMessage = null;
    this.isVerified = false;
    this.isLoaded = false;

    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        const backendVerifyUrl = `${environment.apiBaseUrl}/auth/verify-email`;

        // === THAY ĐỔI TẠI ĐÂY ===
        // Thêm { responseType: 'text' } để HttpClient mong đợi phản hồi dạng text
        this.http.get(`${backendVerifyUrl}?token=${token}`, { responseType: 'text' }).subscribe(
          (response: string) => { // Thay đổi type của response thành string
            this.verificationStatus = response || 'Email của bạn đã được xác minh thành công!';
            this.isVerified = true;
            this.isLoaded = true;
            this.startCountdown();
          },
          (error) => {
            // Khối này chỉ nên chạy khi có lỗi HTTP thực sự (4xx, 5xx)
            this.isVerified = false;
            this.isLoaded = true;
            this.verificationStatus = 'Xác minh thất bại.';
            // Kiểm tra xem lỗi có phải do parsing không, nếu không thì lấy message từ error.error
            this.errorMessage = error.error?.message || 'Token không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.';
            console.error('Lỗi xác minh email:', error);
          }
        );
      } else {
        this.isLoaded = true;
        this.isVerified = false;
        this.verificationStatus = 'Lỗi: Không tìm thấy token xác minh.';
        this.errorMessage = 'Vui lòng sử dụng liên kết đầy đủ từ email của bạn.';
      }
    });
  }

  // Các hàm khác giữ nguyên
  startCountdown(): void {
    this.countdownSubscription = interval(1000).pipe(
      take(this.countdown + 1)
    ).subscribe(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        this.navigateToLogin();
      }
    });
  }

  navigateToLogin(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
    this.router.navigate(['/login']);
  }

  requestResendEmail(): void {
    const userEmail = prompt('Vui lòng nhập lại email của bạn để gửi lại liên kết xác minh:');
    if (userEmail) {
      this.verificationStatus = 'Đang gửi lại email...';
      this.errorMessage = null;
      this.isLoaded = false;

      const resendEmailUrl = `${environment.apiBaseUrl}/auth/resend-verification-email`;

      // Giả định API gửi lại email trả về JSON hoặc có thể được sửa đổi để trả về text
      this.http.post(resendEmailUrl, { email: userEmail }).subscribe(
        (response: any) => {
          this.verificationStatus = response.message || 'Email xác minh đã được gửi lại thành công! Vui lòng kiểm tra hộp thư của bạn.';
          this.isLoaded = true;
          this.isVerified = true; // Giả định gửi lại email thành công thì coi là verified để hiển thị thông báo tích cực
        },
        (error) => {
          this.isLoaded = true;
          this.isVerified = false;
          this.verificationStatus = 'Không thể gửi lại email.';
          this.errorMessage = error.error?.message || 'Có lỗi xảy ra khi yêu cầu gửi lại email.';
          console.error('Lỗi gửi lại email:', error);
        }
      );
    }
  }

  ngOnDestroy(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }
}