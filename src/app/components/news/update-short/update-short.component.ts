import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ShortService, Short } from '../../../services/short.service';

@Component({
  selector: 'app-update-short',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './update-short.component.html',
  styleUrls: ['./update-short.component.scss']
})
export class UpdateShortComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Form
  shortForm: FormGroup;
  loading = false;
  error = '';

  // File upload
  selectedVideo: File | null = null;
  selectedThumbnail: File | null = null;
  videoPreview: string | null = null;
  thumbnailPreview: string | null = null;

  // Short data
  short: Short | null = null;
  shortId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private shortService: ShortService,
    private toastr: ToastrService
  ) {
    this.shortForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.shortId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.shortId) {
      this.loadShort();
    } else {
      this.showError('ID short không hợp lệ');
      this.router.navigate(['/admin/shorts']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load short data
  loadShort(): void {
    if (!this.shortId) return;

    this.loading = true;
    this.error = '';

    this.shortService.getShortById(this.shortId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (short) => {
          this.short = short;
          this.shortForm.patchValue({
            title: short.title
          });
          
          // Set previews if URLs exist
          if (short.videoUrl) {
            this.videoPreview = this.shortService.getVideoUrlFromPath(short.videoUrl);
          }
          if (short.thumbnail) {
            this.thumbnailPreview = this.shortService.getThumbnailUrlFromPath(short.thumbnail);
          }
          
          this.loading = false;
        },
        error: (error: any) => {
          const errorMessage = error.message || 'Không thể tải thông tin short';
          this.error = errorMessage;
          this.showError(errorMessage);
          console.error('Error loading short:', error);
          this.loading = false;
        }
      });
  }

  // File selection
  onVideoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (100MB limit)
      if (!this.shortService.validateFileSize(file, 100)) {
        this.showError('Video file size phải nhỏ hơn 100MB');
        return;
      }

      // Validate file format
      if (!this.shortService.validateVideoFormat(file)) {
        this.showError('Định dạng video không được hỗ trợ. Hỗ trợ: MP4, AVI, MOV, WMV, FLV, WEBM');
        return;
      }

      this.selectedVideo = file;
      this.createVideoPreview(file);
    }
  }

  onThumbnailSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (!this.shortService.validateFileSize(file, 5)) {
        this.showError('Thumbnail size phải nhỏ hơn 5MB');
        return;
      }

      // Validate file format
      if (!this.shortService.validateImageFormat(file)) {
        this.showError('Định dạng ảnh không được hỗ trợ. Hỗ trợ: JPG, PNG, GIF, WEBP');
        return;
      }

      this.selectedThumbnail = file;
      this.createThumbnailPreview(file);
    }
  }

  private createVideoPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.videoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  private createThumbnailPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.thumbnailPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Form submission
  onSubmit(): void {
    if (this.shortForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    if (!this.shortId) {
      this.showError('ID short không hợp lệ');
      return;
    }

    // Kiểm tra xem có thay đổi gì không
    if (!this.selectedVideo && !this.selectedThumbnail) {
      const currentTitle = this.short?.title;
      if (currentTitle === this.shortForm.value.title) {
        this.showError('Không có thay đổi nào để cập nhật');
        return;
      }
    }

    this.loading = true;
    this.error = '';

    this.shortService.updateShort(
      this.shortId, 
      this.shortForm.value.title, 
      this.selectedVideo || undefined,
      this.selectedThumbnail || undefined
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.showSuccess('Cập nhật short thành công!');
        this.router.navigate(['/admin/shorts']);
      },
      error: (error: any) => {
        const errorMessage = error.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
        this.error = errorMessage;
        this.showError(errorMessage);
        console.error('Error updating short:', error);
        this.loading = false;
      }
    });
  }

  // Cancel
  onCancel(): void {
    this.router.navigate(['/admin/shorts']);
  }

  // Utility methods
  private markFormGroupTouched(): void {
    Object.keys(this.shortForm.controls).forEach(key => {
      const control = this.shortForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    this.toastr.success(message, 'Thành công!');
  }

  private showError(message: string): void {
    this.toastr.error(message, 'Lỗi!');
  }

  // Check if form field is invalid
  isFieldInvalid(fieldName: string): boolean {
    const field = this.shortForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Get field error message
  getFieldErrorMessage(fieldName: string): string {
    const field = this.shortForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Trường này là bắt buộc';
      if (field.errors['minlength']) return `Tối thiểu ${field.errors['minlength'].requiredLength} ký tự`;
      if (field.errors['maxlength']) return `Tối đa ${field.errors['maxlength'].requiredLength} ký tự`;
    }
    return '';
  }

  // Get file size display
  getFileSizeDisplay(file: File): string {
    return this.shortService.formatFileSize(file.size);
  }

  // Get file name for display
  getFileName(file: File): string {
    return file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name;
  }

  // Check if file is selected
  hasSelectedVideo(): boolean {
    return this.selectedVideo !== null;
  }

  hasSelectedThumbnail(): boolean {
    return this.selectedThumbnail !== null;
  }

  // Remove selected file
  removeSelectedVideo(): void {
    this.selectedVideo = null;
    this.videoPreview = this.short?.videoUrl ? this.shortService.getVideoUrlFromPath(this.short.videoUrl) : null;
  }

  removeSelectedThumbnail(): void {
    this.selectedThumbnail = null;
    this.thumbnailPreview = this.short?.thumbnail ? this.shortService.getThumbnailUrlFromPath(this.short.thumbnail) : null;
  }
} 