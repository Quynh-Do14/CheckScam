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

  selectedFiles: File[] = [];
  imagePreviews: { file: File; preview: string; id: string }[] = [];
  private imageIdCounter = 0;
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
    const files = Array.from(event.target.files) as File[];
    
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error = `File ${file.name} không phải là hình ảnh`;
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error = `File ${file.name} vượt quá 5MB`;
        continue;
      }

      // Check if maximum images reached (max 5 images)
      if (this.imagePreviews.length >= 5) {
        this.error = 'Chỉ được đăng tối đa 5 ảnh';
        break;
      }

      // Check if file already exists
      if (this.selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
        continue;
      }

      this.selectedFiles.push(file);
      this.error = '';

      // Create preview
      const reader = new FileReader();
      const imageId = `img_${++this.imageIdCounter}`;
      reader.onload = (e) => {
        this.imagePreviews.push({
          file: file,
          preview: e.target?.result as string,
          id: imageId
        });
      };
      reader.readAsDataURL(file);
    }

    // Clear the input to allow selecting the same files again
    event.target.value = '';
  }

  removeImage(imageId: string) {
    const index = this.imagePreviews.findIndex(img => img.id === imageId);
    if (index > -1) {
      const fileToRemove = this.imagePreviews[index].file;
      this.imagePreviews.splice(index, 1);
      
      // Remove from selectedFiles array
      const fileIndex = this.selectedFiles.findIndex(f => f === fileToRemove);
      if (fileIndex > -1) {
        this.selectedFiles.splice(fileIndex, 1);
      }
    }
  }

  removeAllImages() {
    this.selectedFiles = [];
    this.imagePreviews = [];
    this.post.imageUrls = undefined;
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
      // Upload images if selected
      if (this.selectedFiles.length > 0) {
        console.log('Uploading images...');
        const imageUrls: string[] = [];
        
        for (const file of this.selectedFiles) {
          try {
            const uploadResponse = await this.forumService.uploadImage(file).toPromise();
            if (uploadResponse?.data?.imageUrl) {
              imageUrls.push(uploadResponse.data.imageUrl);
            }
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            this.error = `Không thể upload ảnh ${file.name}. Vui lòng thử lại.`;
            return;
          }
        }
        
        // Set both imageUrls (new) and imageUrl (backward compatibility)
        this.post.imageUrls = imageUrls;
        if (imageUrls.length > 0) {
          this.post.imageUrl = imageUrls[0]; // For backward compatibility
        }
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

  // Track by function for ngFor performance
  trackByImageId(index: number, item: { file: File; preview: string; id: string }): string {
    return item.id;
  }
}
