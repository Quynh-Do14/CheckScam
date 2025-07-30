import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { ShortService, Short } from '../../../services/short.service';

// Sử dụng interface Short từ service

// Sử dụng ShortService từ service

@Component({
  selector: 'app-short-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './short-management.component.html',
  styleUrl: './short-management.component.scss'
})
export class ShortManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  shorts: Short[] = [];
  loading = false;
  error = '';

  // Form
  shortForm: FormGroup;

  // File upload
  selectedVideo: File | null = null;
  selectedThumbnail: File | null = null;
  videoPreview: string | null = null;
  thumbnailPreview: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Search
  searchTerm = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private shortService: ShortService
  ) {
    this.shortForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.loadShorts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load shorts
  loadShorts(): void {
    this.loading = true;
    this.error = '';
    
    this.shortService.getAllShorts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shorts) => {
          this.shorts = shorts;
          this.totalItems = this.shorts.length;
          this.loading = false;
        },
        error: (error: any) => {
          const errorMessage = error.message || 'Không thể tải danh sách shorts';
          this.error = errorMessage;
          this.showError(errorMessage);
          console.error('Error loading shorts:', error);
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

    // Validate required files for creating new short
    if (!this.selectedVideo) {
      this.error = 'Vui lòng chọn video';
      return;
    }
    if (!this.selectedThumbnail) {
      this.error = 'Vui lòng chọn thumbnail';
      return;
    }

    this.loading = true;
    this.error = '';

    // Create new short
    this.shortService.createShort(this.shortForm.value.title, this.selectedVideo, this.selectedThumbnail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Tạo short thành công!');
          this.resetForm();
          this.loadShorts();
        },
        error: (error: any) => {
          const errorMessage = error.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
          this.error = errorMessage;
          this.showError(errorMessage);
          console.error('Error creating short:', error);
          this.loading = false;
        }
      });
  }

  // Edit short - redirect to update component
  editShort(short: Short): void {
    this.router.navigate(['/admin/update-short', short.id]);
  }

  // Delete short
  deleteShort(id: number): void {
    if (!confirm('Bạn có chắc chắn muốn xóa short này?')) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.shortService.deleteShort(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Xóa short thành công!');
          this.loadShorts();
        },
        error: (error: any) => {
          const errorMessage = error.message || 'Không thể xóa short';
          this.error = errorMessage;
          this.showError(errorMessage);
          console.error('Error deleting short:', error);
          this.loading = false;
        }
      });
  }

  // Reset form
  resetForm(): void {
    this.shortForm.reset();
    this.selectedVideo = null;
    this.selectedThumbnail = null;
    this.videoPreview = null;
    this.thumbnailPreview = null;
    this.error = '';
  }

  // Cancel edit - no longer needed as edit is handled by separate component

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

  // Get filtered and paginated shorts
  get filteredShorts(): Short[] {
    let filtered = this.shorts;
    
    if (this.searchTerm) {
      filtered = filtered.filter(short => 
        short.title.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }

  get paginatedShorts(): Short[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredShorts.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredShorts.length / this.itemsPerPage);
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Get URL methods
  getVideoUrl(short: Short): string {
    if (short.videoUrl) {
      return this.shortService.getVideoUrlFromPath(short.videoUrl);
    }
    return '';
  }

  getThumbnailUrl(short: Short): string {
    if (short.thumbnail) {
      return this.shortService.getThumbnailUrlFromPath(short.thumbnail);
    }
    return '';
  }

  // Format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
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

  // Track by function for ngFor
  trackById(index: number, item: Short): number {
    return item.id || index;
  }

  // Handle image error
  onImageError(event: any): void {
    // Nếu đã là placeholder thì không gán lại nữa để tránh vòng lặp
    if (!event.target.src.includes('data:image/svg+xml')) {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0IDg4LjU0NCA4MSA5OSA4MUgxMDFDMTExLjQ1NiA4MSAxMjAgODkuNTQ0IDEyMCAxMDBWMTEwQzEyMCAxMjAuNDU2IDExMS40NTYgMTI5IDEwMSAxMjlIOU5DOSA4OC41NDQgODEgODAgODguNTQ0IDgwIDEwMFYxMDBaIiBmaWxsPSIjQ0NDQ0NDIi8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0IDg4LjU0NCA4MSA5OSA4MUgxMDFDMTExLjQ1NiA4MSAxMjAgODkuNTQ0IDEyMCAxMDBWMTEwQzEyMCAxMjAuNDU2IDExMS40NTYgMTI5IDEwMSAxMjlIOU5DOSA4OC41NDQgODEgODAgODguNTQ0IDgwIDEwMFYxMDBaIiBmaWxsPSIjOTk5OTk5Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5OTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
    }
  }

  // Play video
  playVideo(short: Short): void {
    const videoUrl = this.getVideoUrl(short);
    if (videoUrl) {
      window.open(videoUrl, '_blank');
    }
  }

  // View short details
  viewShort(short: Short): void {
    // Navigate to short detail page or open modal
    console.log('Viewing short:', short);
  }

  // Get page numbers for pagination
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  // Popup methods
  isPopupVisible = false;

  togglePopup(): void {
    this.isPopupVisible = !this.isPopupVisible;

    if (!this.isPopupVisible) {
      // Reset form when closing
      this.resetForm();
    }
  }

  closePopup(evt: MouseEvent): void {
    if ((evt.target as HTMLElement).classList.contains('popup-overlay')) {
      this.togglePopup();
    }
  }

  // Detail modal methods
  isDetailModalVisible = false;
  selectedShort: Short | null = null;

  viewShortDetail(short: Short): void {
    this.selectedShort = short;
    this.isDetailModalVisible = true;
  }

  closeDetailModal(evt?: MouseEvent): void {
    if (!evt || (evt.target as HTMLElement).classList.contains('detail-modal-overlay')) {
      this.isDetailModalVisible = false;
      this.selectedShort = null;
    }
  }

  onVideoError(short: Short): void {
    console.error('Video error:', short.title, short.videoUrl);
  }

  // Get file size display
  getFileSizeDisplay(file: File): string {
    return this.shortService.formatFileSize(file.size);
  }

  // Check if file is selected
  hasSelectedVideo(): boolean {
    return this.selectedVideo !== null;
  }

  hasSelectedThumbnail(): boolean {
    return this.selectedThumbnail !== null;
  }

  // Get file name for display
  getFileName(file: File): string {
    return file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name;
  }
}
