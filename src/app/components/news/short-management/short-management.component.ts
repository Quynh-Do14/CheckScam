import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';

// DTOs
interface Short {
  id?: number;
  title: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Service for API calls
class ShortManagementService {
  private apiUrl = environment.apiBaseUrl + '/shorts';

  async getAllShorts(): Promise<Short[]> {
    const response = await fetch(this.apiUrl);
    if (!response.ok) throw new Error('Failed to fetch shorts');
    return response.json();
  }

  async getShortById(id: number): Promise<Short> {
    const response = await fetch(`${this.apiUrl}/${id}`);
    if (!response.ok) throw new Error('Short not found');
    return response.json();
  }

  async createShort(formData: FormData): Promise<Short> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to create short');
    return response.json();
  }

  async updateShort(id: number, short: Short): Promise<Short> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(short)
    });
    if (!response.ok) throw new Error('Failed to update short');
    return response.json();
  }

  async deleteShort(id: number): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete short');
  }

  async incrementViews(id: number): Promise<Short> {
    const response = await fetch(`${this.apiUrl}/${id}/view`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to increment views');
    return response.json();
  }

  getVideoUrl(filename: string): string {
    return `${environment.apiUrl}/api/v1/shorts/videos/${filename}`;
  }

  getThumbnailUrl(filename: string): string {
    return `${environment.apiUrl}/api/v1/shorts/thumbnails/${filename}`;
  }
}

@Component({
  selector: 'app-short-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './short-management.component.html',
  styleUrl: './short-management.component.scss'
})
export class ShortManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private shortService = new ShortManagementService();

  // Data
  shorts: Short[] = [];
  loading = false;
  error = '';

  // Form
  shortForm: FormGroup;
  isEditing = false;
  editingShortId: number | null = null;

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
    private router: Router
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
  async loadShorts(): Promise<void> {
    this.loading = true;
    this.error = '';
    
    try {
      this.shorts = await this.shortService.getAllShorts();
      this.totalItems = this.shorts.length;
    } catch (error) {
      this.error = 'Không thể tải danh sách shorts';
      console.error('Error loading shorts:', error);
    } finally {
      this.loading = false;
    }
  }

  // File selection
  onVideoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedVideo = file;
      this.createVideoPreview(file);
    }
  }

  onThumbnailSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
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
  async onSubmit(): Promise<void> {
    if (this.shortForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    if (!this.selectedVideo && !this.isEditing) {
      this.error = 'Vui lòng chọn video';
      return;
    }

    if (!this.selectedThumbnail && !this.isEditing) {
      this.error = 'Vui lòng chọn thumbnail';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      if (this.isEditing && this.editingShortId) {
        // Update existing short
        const shortData = this.shortForm.value;
        await this.shortService.updateShort(this.editingShortId, shortData);
        this.showSuccess('Cập nhật short thành công!');
      } else {
        // Create new short
        const formData = new FormData();
        formData.append('title', this.shortForm.value.title);
        
        if (this.selectedVideo) {
          formData.append('file', this.selectedVideo);
        }
        
        if (this.selectedThumbnail) {
          formData.append('thumbnail', this.selectedThumbnail);
        }

        await this.shortService.createShort(formData);
        this.showSuccess('Tạo short thành công!');
      }

      this.resetForm();
      this.loadShorts();
    } catch (error) {
      this.error = 'Có lỗi xảy ra. Vui lòng thử lại.';
      console.error('Error submitting form:', error);
    } finally {
      this.loading = false;
    }
  }

  // Edit short
  editShort(short: Short): void {
    this.isEditing = true;
    this.editingShortId = short.id || null;
    this.shortForm.patchValue({
      title: short.title
    });
    
    // Set previews if URLs exist
    if (short.videoUrl) {
      this.videoPreview = short.videoUrl;
    }
    if (short.thumbnailUrl) {
      this.thumbnailPreview = short.thumbnailUrl;
    }
  }

  // Delete short
  async deleteShort(id: number): Promise<void> {
    if (!confirm('Bạn có chắc chắn muốn xóa short này?')) {
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.shortService.deleteShort(id);
      this.showSuccess('Xóa short thành công!');
      this.loadShorts();
    } catch (error) {
      this.error = 'Không thể xóa short';
      console.error('Error deleting short:', error);
    } finally {
      this.loading = false;
    }
  }

  // Reset form
  resetForm(): void {
    this.shortForm.reset();
    this.isEditing = false;
    this.editingShortId = null;
    this.selectedVideo = null;
    this.selectedThumbnail = null;
    this.videoPreview = null;
    this.thumbnailPreview = null;
    this.error = '';
  }

  // Cancel edit
  cancelEdit(): void {
    this.resetForm();
  }

  // Utility methods
  private markFormGroupTouched(): void {
    Object.keys(this.shortForm.controls).forEach(key => {
      const control = this.shortForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    // You can implement a toast service here
    alert(message);
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
      const filename = short.videoUrl.split('/').pop();
      return filename ? this.shortService.getVideoUrl(filename) : '';
    }
    return '';
  }

  getThumbnailUrl(short: Short): string {
    if (short.thumbnailUrl) {
      const filename = short.thumbnailUrl.split('/').pop();
      return filename ? this.shortService.getThumbnailUrl(filename) : '';
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
}
