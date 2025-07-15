import { Component, ViewChild, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { RegisterDTO } from '../../dtos/register.dto';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  @ViewChild('registerForm') registerForm!: NgForm;
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private router: Router,
    private userService: UserService
  ) { }

  ngOnInit() { }

  register() {
    this.errorMessage = ''; 
    this.successMessage = ''; 

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Mật khẩu và xác nhận mật khẩu không khớp.';
      return; 
    }

    if (this.registerForm.invalid) {
      this.errorMessage = 'Vui lòng điền đầy đủ và chính xác các thông tin.';
      return; 
    }

    const registerDTO: RegisterDTO = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    this.userService.register(registerDTO).subscribe({
      next: (response) => {
        this.successMessage = 'Đăng ký tài khoản thành công! Vui lòng xác minh email để kích hoạt tài khoản của bạn.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000); 
      },
      error: (error) => {
        console.error('Registration error:', error);
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.error) {
          this.errorMessage = error.error;
        } else {
          this.errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
        }
      }
    });
  }
}