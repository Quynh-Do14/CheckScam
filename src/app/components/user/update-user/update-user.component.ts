import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserDTO } from '../../../dtos/user.dto';
import { UserService } from '../../../services/user.service';
import { HttpErrorResponse } from '@angular/common/http'; 

interface UserData {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-update-user',
  standalone: true, 
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './update-user.component.html',
  styleUrl: './update-user.component.scss' 
})
export class UpdateUserComponent implements OnInit {
  name = '';
  email = '';
  userId!: number;

  constructor(
    private userService: UserService,
    private dialogRef: MatDialogRef<UpdateUserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserData
  ) { }

  ngOnInit() {
    if (this.data) {
      console.log('User data:', this.data);
      this.userId = this.data.id;
      this.name = this.data.name;
      this.email = this.data.email;
    }
  }


  updateUser() {
    if (!this.userId) {
      alert('Không tìm thấy thông tin người dùng.');
      return;
    }

    const userDTO: UserDTO = {
      name: this.name,
      email: this.email,
    };

    this.userService.updateUser(this.userId, userDTO).subscribe({
      next: () => {
        this.dialogRef.close(true); 
      },
      error: (error: HttpErrorResponse) => { 
        let errorMessage = 'Đã xảy ra lỗi khi cập nhật tài khoản.';
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error; 
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message; 
        }
        alert(errorMessage);
        console.error('Lỗi cập nhật người dùng:', error);
      }
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}