
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../services/user.service';
import { UserStateService } from '../../services/user-state.service';
import { Router } from '@angular/router';
import { UpdateUserDTO, UpdateProfileDTO, UserProfileDTO, ProfileResponseDTO } from '../../dtos/profile.dto';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule 
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  currentUser: UserProfileDTO = {} as UserProfileDTO; 
  userRole: string[] = []; // Biến này sẽ giữ giá trị string[]
  isEditing: boolean = false;
  loading: boolean = false;
  uploading: boolean = false; 
  avatarUrl: string = '/assets/img/undraw_profile.svg';
  selectedFile: File | null = null;
  error: string = '';
  isSuccessMessageVisible: boolean = false;
  successMessageTitle: string = 'Thành công!';
  successMessageContent: string = '';
  successIconClass: string = 'fas fa-check-circle';
  currentUserId: number = 0;
  
  showAddProfileForm: boolean = false;
  newProfile = { nameInfo: '', info: '' };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private userStateService: UserStateService,
    private router: Router,
    private http: HttpClient
  ) {
    this.profileForm = this.fb.group({
      name: [{value: '', disabled: true}, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]], 
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]],
      description: [{value: '', disabled: true}] 
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    console.log('🔍 === PROFILE LOADING ===');
    this.loading = true;
    this.error = '';
    
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.log('❌ No JWT token found - redirecting to login');
      this.error = 'Phiên làm việc hết hạn. Vui lòng đăng nhập lại.';
      this.loading = false;
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
      return;
    }
    
    // Sử dụng userService.getCurrentUser() không tham số
    console.log(`🚀 Getting current user via API call using service...`);
    this.userService.getCurrentUser().subscribe({ // Gọi phương thức không tham số
      next: (response: any) => {
        console.log('✅ API Raw Response:', response);
        
        // SỬA LỖI Ở ĐÂY: Kiểm tra cấu trúc response.data hoặc response trực tiếp
        const userDataFromApi = response.data || response; // Hỗ trợ cả {code: 200, data: user} và user trực tiếp
        
        if (userDataFromApi && userDataFromApi.id) { // Đảm bảo có dữ liệu và có ID
          console.log('👤 User data from API (extracted):', userDataFromApi);
          
          // Xử lý roles từ API response. Có thể là [{id, name}] hoặc ["ROLE_ADMIN"]
          let roles: string[] = [];
          if (userDataFromApi.roles && Array.isArray(userDataFromApi.roles)) {
            roles = userDataFromApi.roles.map((r: any) => typeof r === 'object' && r.name ? r.name : r);
          } else if (userDataFromApi.role && Array.isArray(userDataFromApi.role)) {
            roles = userDataFromApi.role; // Trường hợp role là mảng string trực tiếp
          }
          roles = roles.filter(r => typeof r === 'string'); // Đảm bảo tất cả là string

          // Khởi tạo currentUser bằng UserProfileDTO.
          this.currentUser = new UserProfileDTO({
            id: userDataFromApi.id,
            name: userDataFromApi.name,
            email: userDataFromApi.email,
            avatar: userDataFromApi.avatar,
            description: userDataFromApi.description,
            role: roles, // Sử dụng roles đã xử lý
            profiles: userDataFromApi.profiles // profiles đã được xử lý trong UserProfileDTO
          });
          
          this.currentUserId = this.currentUser.id; // Cập nhật currentUserId
          console.log('👤 Final currentUser object (after DTO mapping):', this.currentUser);
          
          // Gán giá trị an toàn cho userRole
          this.userRole = this.currentUser.role; 

          if (this.currentUser.avatar) {
            const cleanPath = this.currentUser.avatar.startsWith('/') ? 
              this.currentUser.avatar.substring(1) : this.currentUser.avatar;
            this.avatarUrl = this.currentUser.avatar.startsWith('http') ? 
              this.currentUser.avatar : 
              `${environment.apiBaseUrl}/${cleanPath}`;
          } else {
            this.avatarUrl = '/assets/img/undraw_profile.svg';
          }
          
          console.log('🖼️ Avatar URL:', this.avatarUrl);
          console.log('🆔 Current User ID (from API):', this.currentUserId);
          
          this.updateFormWithUserData(this.currentUser);
          
          const userInfoToStore = {
            id: this.currentUser.id,
            name: this.currentUser.name,
            email: this.currentUser.email,
            role: this.currentUser.role, // Lưu roles đã được xử lý
            avatar: this.currentUser.avatar,
            description: this.currentUser.description
          };
          localStorage.setItem('user', JSON.stringify(userInfoToStore));
          console.log('💾 Updated localStorage:', userInfoToStore);
          
          this.loading = false;
          this.error = '';
          
        } else {
          // Xử lý trường hợp response không có data hoặc cấu trúc không hợp lệ
          console.log('❌ Invalid API response structure or missing data property:', response);
          this.error = 'Dữ liệu trả về không hợp lệ từ server. Vui lòng kiểm tra lại cấu trúc JSON.';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('❌ API call failed:', error);
        if (error.status === 401 || error.status === 403) {
            this.error = 'Bạn không có quyền truy cập hoặc phiên làm việc hết hạn. Vui lòng đăng nhập lại.';
            setTimeout(() => { this.router.navigate(['/login']); }, 2000);
        } else if (error.status === 404) {
            this.error = 'Không tìm thấy thông tin người dùng. Vui lòng kiểm tra lại ID hoặc đường dẫn API.';
        } else {
            this.error = `Không thể tải thông tin người dùng. Lỗi: ${error.message || 'Lỗi không xác định'}. Vui lòng thử lại sau.`;
        }
        this.loading = false;
      }
    });
    
    console.log('🔍 === END PROFILE LOADING ===');
  }
  
  updateFormWithUserData(userData: UserProfileDTO) {
    this.profileForm.patchValue({
      name: userData.name,
      email: userData.email,
      description: userData.description || ''
    });
    // Disable fields if not editing
    if (!this.isEditing) {
        this.profileForm.get('name')?.disable();
        this.profileForm.get('email')?.disable();
        this.profileForm.get('description')?.disable();
    }
  }

  updateLocalStorage(userData: UserProfileDTO) {
    const existingData = localStorage.getItem('user');
    let userLocalData = existingData ? JSON.parse(existingData) : {};
    
    userLocalData = {
      ...userLocalData,
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      description: userData.description,
      // Đảm bảo roles là mảng khi lưu vào localStorage
      role: Array.isArray(userData.role) ? userData.role : [] 
    };
    
    localStorage.setItem('user', JSON.stringify(userLocalData));
    
    this.userStateService.updateUser({
      name: userData.name,
      avatar: userData.avatar,
      description: userData.description
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    
    if (this.isEditing) {
      this.profileForm.get('name')?.enable();
      this.profileForm.get('description')?.enable();
    } else {
      this.profileForm.get('name')?.disable();
      this.profileForm.get('description')?.disable();
      
      this.showAddProfileForm = false;
      this.newProfile = { nameInfo: '', info: '' };
      
      this.loadUserProfile(); // Tải lại dữ liệu gốc từ API khi hủy chỉnh sửa
    }
  }

  onSubmit() {
    if (this.profileForm.valid && !this.loading && !this.uploading) {
      this.loading = true;
      this.error = '';
      
      const formData = new FormData();
      
      const name = this.profileForm.get('name')?.value;
      const description = this.profileForm.get('description')?.value;
      
      if (name) formData.append('name', name);
      if (description) formData.append('description', description);
      if (this.selectedFile) formData.append('avatar', this.selectedFile);
      
      console.log('FormData being sent:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      // Không cần set headers['Content-Type'] cho FormData, trình duyệt sẽ tự động làm
      const token = localStorage.getItem('jwt_token');
      const headers: any = {
        'Accept-Language': 'vi'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      this.http.put(`${environment.apiBaseUrl}/users/${this.currentUserId}`, formData, {
        headers: headers
      }).pipe(
        catchError(error => {
          console.error('Error updating user info:', error);
          this.error = error?.error?.message || 'Có lỗi xảy ra khi cập nhật thông tin!';
          this.loading = false;
          return of(null);
        })
      ).subscribe(updatedResponse => {
        this.loading = false;
        
        if (updatedResponse) {
          const updatedUser = (updatedResponse as any).data || updatedResponse; 
          console.log('Updated user received:', updatedUser);
          
          this.currentUser.name = updatedUser.name || this.currentUser.name;
          this.currentUser.description = updatedUser.description || this.currentUser.description;
          
          if (updatedUser.avatar) {
            this.currentUser.avatar = updatedUser.avatar;
            const cleanPath = updatedUser.avatar.startsWith('/') ? 
              updatedUser.avatar.substring(1) : updatedUser.avatar;
            this.avatarUrl = updatedUser.avatar.startsWith('http') ? 
              updatedUser.avatar : 
              `${environment.apiBaseUrl}/${cleanPath}`;
          }
          
          // Cập nhật localStorage và user state sau khi update thành công
          this.updateLocalStorage(this.currentUser);
          this.userStateService.updateUser({
            name: this.currentUser.name,
            avatar: this.currentUser.avatar,
            description: this.currentUser.description
          });
          
          this.selectedFile = null;
          this.showSuccessMessage('Cập nhật thành công!', `Thông tin tài khoản "<strong>${this.currentUser.name}</strong>" đã được cập nhật thành công.`);
          this.toggleEdit(); // Tắt chế độ chỉnh sửa và tải lại data
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched() {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  getRoleName(roles: string[]): string { 
    if (!roles || roles.length === 0) return 'Người dùng';
    
    if (roles.includes('ADMIN')) return 'Quản trị viên';
    if (roles.includes('COLLAB')) return 'Cộng tác viên';
    if (roles.includes('USER')) return 'Người dùng';
    
    const firstRole = roles[0];
    return this.formatRoleName(firstRole);
  }
  
  formatRoleName(role: string): string {
    switch(role.toUpperCase()) {
      case 'ADMIN': return 'Quản trị viên';
      case 'COLLAB': return 'Cộng tác viên';
      case 'USER': return 'Người dùng';
      case 'MODERATOR': return 'Người điều hành';
      case 'EDITOR': return 'Biên tập viên';
      default: 
        return role.toLowerCase()
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Chỉ chấp nhận các file ảnh: JPG, PNG, GIF');
        return;
      }
      
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        alert('Kích thước file không được vượt quá 2MB');
        return;
      }
      
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onImageError(event: any) {
    console.log('Image failed to load:', this.avatarUrl);
    event.target.src = '/assets/img/undraw_profile.svg';
    this.avatarUrl = '/assets/img/undraw_profile.svg';
  }

  private debugUserData() {
    console.log('🔍 === USER DATA DEBUG ===');
    console.log('Current User Object:', this.currentUser);
    console.log('User Role:', this.userRole);
    console.log('Current User ID:', this.currentUserId);
    console.log('Avatar URL:', this.avatarUrl);
    console.log('Form Values:', this.profileForm.value);
    console.log('LocalStorage user:', localStorage.getItem('user'));
    console.log('LocalStorage token exists:', !!localStorage.getItem('jwt_token'));
    
    this.userService.debugJWTStructure(); // Gọi hàm debug từ UserService
    
    console.log('🔍 === END DEBUG ===');
  }

  private clearUserData() {
    console.log('🧹 Clearing user data from localStorage...');
    localStorage.removeItem('user');
    localStorage.removeItem('jwt_token');
    console.log('✅ User data cleared successfully');
    alert('Dữ liệu đã được xóa. Bạn sẽ được chuyển đến trang đăng nhập.');
    this.router.navigate(['/login']);
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
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
  
  getProfileIcon(nameInfo: string): string {
    const name = nameInfo.toLowerCase();
    if (name.includes('facebook')) return 'fab fa-facebook';
    if (name.includes('zalo')) return 'fas fa-comment';
    if (name.includes('phone') || name.includes('điện thoại')) return 'fas fa-phone';
    if (name.includes('email')) return 'fas fa-envelope';
    if (name.includes('telegram')) return 'fab fa-telegram';
    if (name.includes('whatsapp')) return 'fab fa-whatsapp';
    if (name.includes('website')) return 'fas fa-globe';
    return 'fas fa-link';
  }
  
  addNewProfile() {
    this.showAddProfileForm = true;
    this.newProfile = { nameInfo: '', info: '' };
  }
  
  cancelAddProfile() {
    this.showAddProfileForm = false;
    this.newProfile = { nameInfo: '', info: '' };
  }
  
  saveNewProfile() {
    if (this.newProfile.nameInfo && this.newProfile.info && this.currentUserId) {
      this.loading = true;
      const profileData: UpdateProfileDTO = {
        nameInfo: this.newProfile.nameInfo,
        info: this.newProfile.info
      };

      this.userService.createProfile(this.currentUserId, profileData).subscribe({
        next: (response) => {
          console.log('Profile created on backend:', response);
          this.showSuccessMessage('Thêm thành công!', `Profile "<strong>${this.newProfile.nameInfo}</strong>" đã được thêm thành công.`);
          this.showAddProfileForm = false;
          this.newProfile = { nameInfo: '', info: '' };
          this.loadUserProfile(); // Tải lại dữ liệu để hiển thị profile mới
        },
        error: (error) => {
          console.error('Error creating profile:', error);
          this.error = error?.error?.message || 'Có lỗi khi thêm profile.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'Vui lòng điền đầy đủ thông tin profile.';
    }
  }
  
  removeProfile(index: number) {
    if (this.currentUser.profiles && index >= 0 && index < this.currentUser.profiles.length) {
      const removedProfile = this.currentUser.profiles[index];
      if (removedProfile.id) { // Chỉ xóa nếu profile có ID từ backend
        if (confirm(`Bạn có chắc chắn muốn xóa ${removedProfile.nameInfo}: ${removedProfile.info} không?`)) {
          this.loading = true;
          this.userService.deleteProfile(removedProfile.id).subscribe({
            next: () => {
              console.log('Profile deleted on backend:', removedProfile.id);
              this.showSuccessMessage('Xóa thành công!', `Profile "<strong>${removedProfile.nameInfo}</strong>" đã được xóa thành công.`);
              this.loadUserProfile(); // Tải lại dữ liệu sau khi xóa
            },
            error: (error) => {
              console.error('Error deleting profile:', error);
              this.error = error?.error?.message || 'Có lỗi khi xóa profile.';
              this.loading = false;
            }
          });
        }
      } else {
        // Xóa profile tạm thời (chưa lưu backend)
        this.currentUser.profiles.splice(index, 1);
        console.log('🗑️ Removed temporary profile locally:', removedProfile);
      }
    }
  }
  
  openProfileLink(profile: any) {
    if (!profile.info) return;
    
    let url = profile.info;
    
    if (profile.nameInfo.toLowerCase().includes('facebook')) {
      if (!url.startsWith('http')) { url = `https://facebook.com/${url}`; }
    } else if (profile.nameInfo.toLowerCase().includes('zalo')) {
      if (!url.startsWith('http')) { url = `https://zalo.me/${url}`; }
    } else if (profile.nameInfo.toLowerCase().includes('telegram')) {
      if (!url.startsWith('http')) { url = `https://t.me/${url}`; }
    } else if (profile.nameInfo.toLowerCase().includes('whatsapp')) {
        if (!url.startsWith('http') && !url.startsWith('https://wa.me')) {
            url = `https://wa.me/${url.replace(/[^0-9+]/g, '')}`; 
        }
    } else if (profile.nameInfo.toLowerCase().includes('phone') || profile.nameInfo.toLowerCase().includes('điện thoại')) {
      url = `tel:${url}`;
    } else if (profile.nameInfo.toLowerCase().includes('email')) {
      url = `mailto:${url}`;
    } else if (!url.startsWith('http') && !url.startsWith('tel:') && !url.startsWith('mailto:')) {
      url = `https://${url}`;
    }
    
    console.log('🔗 Opening profile link:', url);
    window.open(url, '_blank');
  }
  
  getPlaceholderForProfileType(type: string): string {
    switch (type) {
      case 'Facebook': return 'VD: https://facebook.com/username hoặc username';
      case 'Zalo': return 'VD: https://zalo.me/username hoặc username';
      case 'Telegram': return 'VD: @username hoặc username';
      case 'WhatsApp': return 'VD: +84xxxxxxxxx';
      case 'Phone': return 'VD: +84xxxxxxxxx';
      case 'Email': return 'VD: email@domain.com';
      case 'Website': return 'VD: https://website.com';
      default: return 'Nhập thông tin liên lạc';
    }
  }
}