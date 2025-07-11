import { Component, EventEmitter, HostListener, OnInit, Output, Input, OnDestroy } from '@angular/core';
import { RouterLink, NavigationEnd, Router, RouterModule } from '@angular/router'; 
import { CommonModule } from '@angular/common'; 
import { UserService } from '../../services/user.service'; 
import { Subscription } from 'rxjs'; 
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    RouterModule 
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() isHeaderHidden: boolean = false;

  isMenuOpen: boolean = false; 
  isProfileDropdownOpen: boolean = false; 
  isLoggedIn: boolean = false; 
  userName: string = 'Người dùng'; 
  userEmail: string = 'admin@gmail.com'; 
  userAvatarUrl: string = '/assets/img/undraw_profile.svg'; 

  @Output() aiTuVanClicked = new EventEmitter<void>();

  private authStatusSubscription!: Subscription; 
  private userDataSubscription!: Subscription; 

  constructor(
    private router: Router,
    private userService: UserService 
  ) { 
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isMenuOpen = false; 
        document.body.classList.remove('no-scroll'); 
        this.isProfileDropdownOpen = false; 
      }
    });
  }

  ngOnInit(): void {
    this.authStatusSubscription = this.userService.authStatus$.subscribe(
      (status) => {
        this.isLoggedIn = status;
      }
    );

    this.userDataSubscription = this.userService.currentUserData$.subscribe(
      (userData) => {
        if (userData) {
          this.userName = userData.name || 'Người dùng';
          this.userEmail = userData.email || 'N/A';
          
          if (userData.avatar) {
            this.userAvatarUrl = userData.avatar.startsWith('http') || userData.avatar.startsWith('data:image/') ? 
                                 userData.avatar : 
                                 `${environment.apiBaseUrl}/${userData.avatar.startsWith('/') ? userData.avatar.substring(1) : userData.avatar}`;
          } else {
            this.userAvatarUrl = '/assets/img/undraw_profile.svg';
          }
        } else {
          this.userName = 'Người dùng';
          this.userEmail = 'N/A';
          this.userAvatarUrl = '/assets/img/undraw_profile.svg';
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.authStatusSubscription) {
      this.authStatusSubscription.unsubscribe();
    }
    if (this.userDataSubscription) { 
      this.userDataSubscription.unsubscribe();
    }
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/assets/img/undraw_profile.svg';
    this.userAvatarUrl = '/assets/img/undraw_profile.svg'; 
  }

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    if (this.isProfileDropdownOpen && !(event.target as HTMLElement).closest('.user-profile')) {
      this.isProfileDropdownOpen = false;
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      document.body.classList.add('no-scroll');
      this.isProfileDropdownOpen = false; 
    } else {
      document.body.classList.remove('no-scroll');
    }
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
    if (this.isProfileDropdownOpen && this.isMenuOpen) {
      this.isMenuOpen = false;
      document.body.classList.remove('no-scroll');
    }
  }

  onAiTuVanClick() {
    this.isMenuOpen = false;
    document.body.classList.remove('no-scroll'); 
    this.aiTuVanClicked.emit(); 
  }

  onNavLinkClick() {
    this.isMenuOpen = false; 
    document.body.classList.remove('no-scroll'); 
    this.isProfileDropdownOpen = false; 
  }

  onProfileClick() {
    this.isProfileDropdownOpen = false; 
    this.router.navigate(['/user/profile']); 
  }

  logout() {
    this.userService.logout().subscribe({
      next: () => {
        console.log('Đăng xuất thành công (Backend response).');
        this.isProfileDropdownOpen = false; 
        this.router.navigate(['/login']); 
      },
      error: (err) => {
        console.error('Lỗi khi đăng xuất:', err);
        this.userService.clearUserData();
        this.isProfileDropdownOpen = false;
        this.router.navigate(['/login']);
        alert('Đăng xuất có lỗi xảy ra, nhưng dữ liệu cục bộ đã được xóa. Vui lòng thử lại hoặc đăng nhập lại.');
      }
    });
  }
}