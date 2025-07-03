import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserDTO } from '../../../dtos/user.dto';
import { UserService } from '../../../services/user.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.scss'
})
export class CreateUserComponent {

  name = '';
  email = '';
  password = '';
  selectedRole: string = 'USER'; // Mặc định là USER

  constructor(
    private userService: UserService,
    private router: Router,
    private dialogRef: MatDialogRef<CreateUserComponent>,
    private toastr: ToastrService,
  ){}
  
  ngOnInit() {
  
  }
  
  createUser(){
    const userDTO: UserDTO = {
      name: this.name,
      email: this.email,
      password: this.password,
      roleName: this.selectedRole // Gửi quyền đã chọn
    };
    this.userService.createUser(userDTO).subscribe({
      next: (response) => {
        this.dialogRef.close({ success: true, userName: this.name });
      },
      error: (error) => {
        console.error('Lỗi tạo tài khoản:', error);
        this.toastr.error(error.error?.message || error.message || 'Lỗi tạo tài khoản', 'Lỗi');
      }
    })
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}