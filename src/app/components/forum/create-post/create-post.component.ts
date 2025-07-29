import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ForumService } from '../../../services/forum.service';
import { UserStateService } from '../../../services/user-state.service';
import { CreateForumPostDto } from '../../../dtos/forum-post.dto';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.scss']
})
export class CreatePostComponent implements OnInit, OnDestroy {
  post: CreateForumPostDto = {
    content: ''
  };

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isSubmitting = false;
  error = '';
  isLoggedIn = false;
  currentUser: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private forumService: ForumService,
    private userStateService: UserStateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAuthStatus();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkAuthStatus() {
    console.log('CreatePostComponent: Checking auth status...');
    this.userStateService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        console.log('CreatePostComponent: User state changed:', user);
        this.isLoggedIn = !!user;
        this.currentUser = user;
        console.log('CreatePostComponent: isLoggedIn =', this.isLoggedIn);
        
        if (!this.isLoggedIn) {
          console.log('CreatePostComponent: User not logged in, redirecting to login...');
          this.router.navigate(['/login']);
        }
      });
  }

  triggerFileInput() {
    const fileInput = document.getElementById('photoInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error = 'Chỉ được chọn file hình ảnh';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'Kích thước file không được vượt quá 5MB';
        return;
      }

      this.selectedFile = file;
      this.error = '';

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.post.imageUrl = undefined;
  }

  onImageError(event: any) {
    // Handle avatar image error
    event.target.src = '/assets/img/undraw_profile.svg';
  }

  getImageUrl(url: string | undefined | null): string {
    if (!url || url.trim() === '') return '/assets/img/undraw_profile.svg';
    
    // If URL is already absolute, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If URL is relative, prepend the API base URL
    const cleanUrl = url.startsWith('/') ? url : '/' + url;
    return 'http://localhost:8080' + cleanUrl;
  }

  async onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    try {
      // Upload image if selected
      if (this.selectedFile) {
        console.log('Uploading image...');
        const uploadResponse = await this.forumService.uploadImage(this.selectedFile).toPromise();
        console.log('Upload response:', uploadResponse);
        this.post.imageUrl = uploadResponse?.data?.imageUrl;
      }

      // Create post
      console.log('Creating post with data:', this.post);
      const response = await this.forumService.createPost(this.post).toPromise();
      console.log('Create post response:', response);
      
      // Navigate to the new post or back to forum
      if (response?.data?.id) {
        this.router.navigate(['/forum/post', response.data.id]);
      } else {
        this.router.navigate(['/forum']);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      this.error = 'Không thể tạo bài viết. Vui lòng thử lại.';
    } finally {
      this.isSubmitting = false;
    }
  }

  validateForm(): boolean {
    if (!this.post.content.trim()) {
      this.error = 'Vui lòng nhập nội dung bài viết';
      return false;
    }

    if (this.post.content.length > 5000) {
      this.error = 'Nội dung không được vượt quá 5000 ký tự';
      return false;
    }

    return true;
  }

  onCancel() {
    this.router.navigate(['/forum']);
  }
}
