import { Component, ViewChild, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { LoginDTO } from '../../dtos/login.dto';
import { TokenService } from '../../services/token.service';
import { HttpErrorResponse } from '@angular/common/http';

declare var google: any;

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
    @ViewChild('loginForm') loginForm!: NgForm;
    username = '';
    password = '';
    // returnUrl: string = '/admin/dashboard'; // KHÔNG CẦN ĐẶT MẶC ĐỊNH Ở ĐÂY NỮA

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private userService: UserService,
        private tokenService: TokenService,
        private ngZone: NgZone
    ) { }

    ngOnInit() {
        // returnUrl sẽ được lấy từ queryParams hoặc xác định sau khi đăng nhập
        // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
        this.clearExistingUserData();
    }

    ngAfterViewInit() {
        setTimeout(() => {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                this.initializeGoogleSignIn();
            } else {
                console.warn('Google GSI script not loaded yet or "google.accounts.id" is not available.');
            }
        }, 500);
    }

    private initializeGoogleSignIn() {
        google.accounts.id.initialize({
            client_id: '1040843887455-1lkcsjnnsbdlkpu2ge90bi20b2ptqd7u.apps.googleusercontent.com',
            callback: (response: any) => this.ngZone.run(() => this.handleGoogleCredentialResponse(response))
        });

        google.accounts.id.renderButton(
            document.getElementById('google-login-button'),
            {
              type: 'standard',
              size: 'large',
              theme: 'outline',
              shape: 'rectangular',
              text: 'signin_with',
              width: '320'
            }
        );
    }

    private clearExistingUserData() {
        localStorage.removeItem('user');
        localStorage.removeItem('jwt_token');
        console.log('🧹 Cleared existing user data on login page');
    }

    login() {
        if (!this.username.trim() || !this.password.trim()) {
            alert('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
            return;
        }

        this.tokenService.clearToken();
        const loginDTO: LoginDTO = {
            username: this.username,
            password: this.password
        };

        this.userService.login(loginDTO).subscribe({
            next: (response) => {
                console.log('🔐 === FULL LOGIN RESPONSE ===');
                console.log(JSON.stringify(response, null, 2));
                console.log('🔐 === END LOGIN RESPONSE ===');

                this.processLoginSuccess(response);
            },
            error: (error: HttpErrorResponse) => {
                console.error('❌ Login error:', error);
                alert(error?.error?.message || 'Đăng nhập thất bại');
            }
        });
    }

    handleGoogleCredentialResponse(response: any) {
        console.log('Google Credential Response:', response);

        if (response.credential) {
            const idToken = response.credential;
            console.log('ID Token from Google:', idToken);

            this.userService.googleLogin(idToken).subscribe({
                next: (backendResponse) => {
                    console.log('Backend response from Google login:', backendResponse);
                    this.processLoginSuccess(backendResponse);
                    alert('Đăng nhập với Google thành công!');
                },
                error: (error: HttpErrorResponse) => {
                    console.error('❌ Error sending ID token to backend:', error);
                    alert('Đăng nhập với Google thất bại: ' + (error?.error?.message || 'Lỗi server.'));
                }
            });
        } else {
            console.error('No credential found in Google Sign-In response.');
            alert('Đăng nhập với Google thất bại: Không nhận được thông tin từ Google.');
        }
    }

    forgotPassword(event: any) {
        event.preventDefault();
        alert('Vui lòng liên hệ quản trị viên để được cấp lại mật khẩu.');
    }

    private processLoginSuccess(response: any) {
        console.log('🔍 Processing login success response...');

        this.userService.saveUserData(response);
        console.log('💾 User data and token saved via UserService.saveUserData');

        const userData = this.userService.getUserData(); 
        let redirectToUrl: string;

        if (userData && userData.role && userData.role.includes('ADMIN')) {
            redirectToUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
            console.log('User is ADMIN, redirecting to:', redirectToUrl);
        } else {
            redirectToUrl = this.route.snapshot.queryParams['returnUrl'] || '/'; 
            console.log('User is regular USER, redirecting to:', redirectToUrl);
        }

        this.router.navigate([redirectToUrl]);
        console.log(`➡️ Navigating to ${redirectToUrl}`);
    }
}