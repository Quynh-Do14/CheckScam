// layout.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserStateService, UserState } from '../../services/user-state.service';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser'; // Thêm import Title service

@Component({
  selector: 'app-layout',
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  userRole: string[] = [];
  isAdmin: boolean = false;
  isCollaborator: boolean = false;
  isDropdownOpen: boolean = false;
  currentUser: any = {
    name: '',
    email: '',
    avatar: '/assets/img/undraw_profile.svg'
  };

  constructor(
    private userService: UserService,
    private userStateService: UserStateService,
    private router: Router,
    private titleService: Title // Inject Title service
  ) { }

  ngOnInit() {
    // Đặt tiêu đề cho tab trình duyệt khi người dùng ở bất kỳ trang nào thuộc layout này
    this.titleService.setTitle('AI6 | Trang quản trị'); 

    this.userStateService.user$.subscribe(user => {
      if (user) {
        this.currentUser = {
          name: user.name,
          email: user.email,
          avatar: user.avatar
        };
        this.userRole = user.role;
        this.isAdmin = this.userRole.includes('ADMIN');
        this.isCollaborator = this.userRole.includes('COLLAB');
      }
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Kiểm tra xem click có nằm ngoài #userDropdown (menu thả xuống) hay không.
    // Thêm kiểm tra cho nút toggle nếu nó không phải là con của #userDropdown mà vẫn mở dropdown.
    if (!target.closest('#userDropdown')) {
      this.isDropdownOpen = false;
    }
  }

  onAvatarError(event: any) {
    event.target.src = '/assets/img/undraw_profile.svg';
  }

  logout() {
    this.userService.logout().subscribe({
      next: () => {
        debugger
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        debugger
        alert(error?.error);
      }
    });
  }
}