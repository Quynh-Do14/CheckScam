import { Component } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserDTO } from '../../dtos/user.dto';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CreateUserComponent } from './create-user/create-user.component';
import { UpdateUserComponent } from './update-user/update-user.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent {
  name : string = '';
  email: string  = '';
  password: string = '';

  accounts: any[] = [];
  pagedAccounts: any[] = [];
  selectedUser: any = null;
  isEditMode = false;

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  maxPagesToShow: number = 5; 

  isDeleteConfirmModalOpen: boolean = false;
  selectedUserIdForModal: number | null = null;

  isSuccessMessageVisible: boolean = false;
  successMessageTitle: string = 'Thành công!';
  successMessageContent: string = '';
  successIconClass: string = 'fas fa-check-circle'; 

  constructor(
    private userService: UserService,
    private router: Router,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.loadListUsers();
  }

  loadListUsers() {
    this.userService.getListUsers().subscribe({
      next: (response) => {
        this.accounts = response.map((user: any) => ({
          ...user,
          password: user.password || ''
        }));
        this.calculatePagination(); 
        this.updatePagedAccounts(); 
      },
      error: (error) => {
        this.toastr.error(error.error?.message || error.message || 'Lỗi tải danh sách người dùng', 'Lỗi');
      }
    })
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.accounts.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1; 
    }
  }

  updatePagedAccounts(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedAccounts = this.accounts.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagedAccounts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagedAccounts();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedAccounts();
    }
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    let startPage: number;
    let endPage: number;

    if (this.totalPages <= this.maxPagesToShow) {
      startPage = 1;
      endPage = this.totalPages;
    } else {
      const maxPagesBeforeCurrentPage = Math.floor(this.maxPagesToShow / 2);
      const maxPagesAfterCurrentPage = Math.ceil(this.maxPagesToShow / 2) - 1;

      if (this.currentPage <= maxPagesBeforeCurrentPage) {
        startPage = 1;
        endPage = this.maxPagesToShow;
      } else if (this.currentPage + maxPagesAfterCurrentPage >= this.totalPages) {
        startPage = this.totalPages - this.maxPagesToShow + 1;
        endPage = this.totalPages;
      } else {
        startPage = this.currentPage - maxPagesBeforeCurrentPage;
        endPage = this.currentPage + maxPagesAfterCurrentPage;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  openDeleteConfirmModal(userId: number): void {
    this.selectedUserIdForModal = userId;
    this.isDeleteConfirmModalOpen = true;
  }

  closeDeleteConfirmModal(): void {
    this.isDeleteConfirmModalOpen = false;
    this.selectedUserIdForModal = null;
  }

  showSuccessMessage(title: string, content: string): void {
    this.successMessageTitle = title;
    this.successMessageContent = content;
    this.isSuccessMessageVisible = true;
  }

  closeSuccessMessage(): void {
    this.isSuccessMessageVisible = false;
    this.successMessageTitle = 'Thành công!';
    this.successMessageContent = '';
  }

  deleteUserConfirmed(id: number) {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.closeDeleteConfirmModal();
        this.showSuccessMessage('Thành công!', 'Tài khoản đã được xóa thành công.');
        this.loadListUsers(); 
      },
      error: (error) => {
        this.toastr.error(error.error?.message || error.message || 'Lỗi xóa người dùng', 'Lỗi');
        this.closeDeleteConfirmModal();
      }
    });
  }

  openDialogCreateUser(): void {
    const dialogRef = this.dialog.open(CreateUserComponent, {
      width: '400px',
      panelClass: 'modern-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success === true) {
        this.loadListUsers();
        this.showSuccessMessage('Tạo thành công!', `Tài khoản "<strong>${result.userName}</strong>" đã được tạo thành công.`);
      }
    });
  }

  openDialogUpdateUser(user: any): void {
    const dialogRef = this.dialog.open(UpdateUserComponent, {
      width: '400px',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password || ''
      },
      panelClass: 'modern-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loadListUsers();
        this.toastr.success('Cập nhật tài khoản thành công', 'Thành công');
      }
    });
  }
}