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
    title: '',
    content: '',
    imageUrl: ''
  };

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isSubmitting = false;
  error = '';
  isLoggedIn = false;

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
    this.userStateService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        if (!this.isLoggedIn) {
          this.router.navigate(['/login']);
        }
      });
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
    this.post.imageUrl = '';
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
        const uploadResponse = await this.forumService.uploadImage(this.selectedFile).toPromise();
        this.post.imageUrl = uploadResponse?.imageUrl || '';
      }

      // Create post
      const response = await this.forumService.createPost(this.post).toPromise();
      
      // Navigate to the new post
      this.router.navigate(['/forum/post', response?.id]);
    } catch (error) {
      console.error('Error creating post:', error);
      this.error = 'Không thể tạo bài viết. Vui lòng thử lại.';
    } finally {
      this.isSubmitting = false;
    }
  }

  validateForm(): boolean {
    if (!this.post.title.trim()) {
      this.error = 'Vui lòng nhập tiêu đề bài viết';
      return false;
    }

    if (this.post.title.length > 200) {
      this.error = 'Tiêu đề không được vượt quá 200 ký tự';
      return false;
    }

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
