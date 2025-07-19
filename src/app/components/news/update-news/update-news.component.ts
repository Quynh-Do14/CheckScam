import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { NewsDTO } from '../../../dtos/news.dto';
import { NewsService } from '../../../services/news.service';
import { environment } from '../../../environments/environment';

interface FileWithPreview extends File {
  preview?: string;
}

@Component({
  selector: 'app-update-news',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './update-news.component.html',
  styleUrl: './update-news.component.scss'
})
export class UpdateNewsComponent implements OnInit, AfterViewInit {
  newId!: number;
  name = '';
  shortDescription = '';
  content = '';
  selectedFiles: FileWithPreview[] = [];
  uploadProgress = 0;
  isMain = false; // Thêm field cho checkbox tin chính

  @ViewChild('contentEditor', { static: false }) contentEditor!: ElementRef;
  @ViewChild('imageInput', { static: false }) imageInput!: ElementRef;

  constructor(
    private newsService: NewsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.newId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.newId) {
      this.loadNewsById();
    }
  }

  ngAfterViewInit() {
    // Initialize editor content after view is ready
    if (this.contentEditor) {
      this.contentEditor.nativeElement.innerHTML = this.content;
      
      // Ensure proper text direction without forcing
      const editor = this.contentEditor.nativeElement;
      editor.style.direction = 'ltr';
      editor.style.textAlign = 'left';
      editor.setAttribute('dir', 'ltr');
    }
  }

  private loadNewsById(): void {
    this.newsService.getNewsById(this.newId).subscribe({
      next: (response) => {
        this.name = response.name;
        this.shortDescription = response.shortDescription;
        
        // Clean content khi load từ database
        this.content = this.cleanTailwindStyles(response.content || '');
        this.isMain = response.isMain || false; // Load isMain status
        
        // Update editor content after loading
        setTimeout(() => {
          if (this.contentEditor) {
            this.contentEditor.nativeElement.innerHTML = this.content;
          }
        }, 0);
      },
      error: (error) => {
        alert(error?.error);
      }
    });
  }

  // ================== Rich Text Editor Methods ==================

  execCommand(command: string, event: Event, value?: string) {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.contentEditor) {
      this.contentEditor.nativeElement.focus();
    }
    
    if (value) {
      document.execCommand(command, false, value);
    } else {
      document.execCommand(command, false);
    }
    
    // Update content
    setTimeout(() => {
      this.onContentChange();
    }, 0);
  }

  changeFontSize(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      this.execCommand('fontSize', event, select.value);
      select.value = ''; // Reset select
    }
  }

  changeTextColor(event: Event) {
    const input = event.target as HTMLInputElement;
    this.execCommand('foreColor', event, input.value);
  }

  changeBackgroundColor(event: Event) {
    const input = event.target as HTMLInputElement;
    this.execCommand('backColor', event, input.value);
  }

  changeHeading(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      if (select.value === 'p') {
        this.execCommand('formatBlock', event, '<p>');
      } else {
        this.execCommand('formatBlock', event, `<${select.value}>`);
      }
      select.value = ''; // Reset select
    }
  }

  insertLink(event: Event) {
    event.preventDefault();
    const url = prompt('Nhập URL:', 'https://');
    if (url && url.trim()) {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        document.execCommand('createLink', false, url);
      } else {
        const linkText = prompt('Nhập text hiển thị:', url);
        if (linkText) {
          const link = `<a href="${url}" target="_blank">${linkText}</a>`;
          document.execCommand('insertHTML', false, link);
        }
      }
      this.onContentChange();
    }
  }

  insertTable(event: Event) {
    event.preventDefault();
    const rows = prompt('Số hàng:', '3');
    const cols = prompt('Số cột:', '3');
    
    if (rows && cols) {
      const numRows = parseInt(rows);
      const numCols = parseInt(cols);
      
      if (numRows > 0 && numCols > 0 && numRows <= 20 && numCols <= 10) {
        let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%;">';
        
        // Header row
        tableHTML += '<thead><tr>';
        for (let j = 0; j < numCols; j++) {
          tableHTML += `<th style="padding: 8px; border: 1px solid #ddd; background: #f8f9fa;">Header ${j + 1}</th>`;
        }
        tableHTML += '</tr></thead><tbody>';
        
        // Data rows
        for (let i = 0; i < numRows; i++) {
          tableHTML += '<tr>';
          for (let j = 0; j < numCols; j++) {
            tableHTML += '<td style="padding: 8px; border: 1px solid #ddd;">&nbsp;</td>';
          }
          tableHTML += '</tr>';
        }
        
        tableHTML += '</tbody></table><p><br></p>';
        document.execCommand('insertHTML', false, tableHTML);
        this.onContentChange();
      } else {
        alert('Vui lòng nhập số hàng (1-20) và số cột (1-10) hợp lệ.');
      }
    }
  }

  insertHorizontalRule(event: Event) {
    event.preventDefault();
    document.execCommand('insertHTML', false, '<hr><p><br></p>');
    this.onContentChange();
  }

  clearFormatting(event: Event) {
    event.preventDefault();
    document.execCommand('removeFormat', false);
    this.onContentChange();
  }

  // ================== Image Handling Methods ==================

  triggerImageUpload() {
    this.imageInput.nativeElement.click();
  }

  insertImages(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach((file, index) => {
        this.uploadAndInsertImage(file, index);
      });
    }
    // Reset input
    input.value = '';
  }

  private async uploadAndInsertImage(file: File, index: number) {
    try {
      // Show upload progress for first image
      if (index === 0) {
        this.uploadProgress = 0;
      }

      // Hiển thị loading placeholder với ID duy nhất
      const loadingId = `loading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const loadingHtml = `<span id="${loadingId}" style="background: #f0f8ff; padding: 8px 16px; border-radius: 4px; border: 1px dashed #007bff; display: inline-block; margin: 8px 0;">📤 Đang upload ${file.name}...</span>`;
      
      // Focus editor and insert loading
      if (this.contentEditor) {
        this.contentEditor.nativeElement.focus();
      }
      
      document.execCommand('insertHTML', false, loadingHtml);
      this.onContentChange();

      console.log('🚀 Bắt đầu upload ảnh:', file.name, 'size:', file.size, 'type:', file.type);
      console.log('🎯 Loading ID:', loadingId);
      
      // Bắt đầu upload lên server
      const response = await this.newsService.uploadContentImage(file).toPromise();
      
      console.log('✅ Upload thành công:', response);
      
      // Lấy thông tin ảnh từ response
      const imageData = response.data || response;
      console.log('🖼️ Image data:', imageData);
      
      if (!imageData.fileName) {
        throw new Error('Không nhận được fileName từ server');
      }
      
      // Tự ghép URL từ environment và fileName
      const fullImageUrl = `${environment.apiUrl}/api/v1/news/image/${imageData.fileName}`;
      const imageHtml = `<img src="${fullImageUrl}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 0.5rem 0; display: block;" />`;
      
      console.log('🎨 Image HTML:', imageHtml);
      console.log('🔗 Full Image URL:', fullImageUrl);
      console.log('📝 FileName from server:', imageData.fileName);
      console.log('🎯 Environment API URL:', environment.apiUrl);
      
      // Thừng thức thay thế loading bằng ảnh thật
      const loadingElement = document.getElementById(loadingId);
      console.log('🔍 Loading element found:', !!loadingElement);
      
      if (loadingElement) {
        loadingElement.outerHTML = imageHtml;
        console.log('✨ Thừng thức thay thế loading bằng ảnh');
      } else {
        // Nếu không tìm thấy loading element, chèn ảnh vào cuối
        console.log('⚠️ Không tìm thấy loading element, chèn ảnh vào cuối');
        document.execCommand('insertHTML', false, imageHtml);
      }
      
      this.onContentChange();

      // Hiện thị thành công
      this.simulateUploadProgress(index, true);
      console.log('✨ Chèn ảnh vào editor thành công!');
      
    } catch (error: any) {
      console.error('❌ Lỗi upload ảnh:', error);
      
      // Xóa loading placeholder nếu có lỗi
      const loadingElements = document.querySelectorAll('[id^="loading-"]');
      loadingElements.forEach(el => {
        if (el.textContent?.includes(file.name)) {
          el.outerHTML = `<span style="color: #dc3545; background: #f8d7da; padding: 8px; border-radius: 4px;">❌ Lỗi upload ${file.name}: ${error.error?.message || error.message || 'Lỗi không xác định'}</span>`;
        }
      });
      
      this.onContentChange();
      
      // Reset progress
      this.uploadProgress = 0;
      
      // Hiện thị lỗi cho user
      alert('Lỗi upload ảnh: ' + (error.error?.message || error.message || 'Lỗi không xác định'));
    }
  }

  private simulateUploadProgress(index: number, success: boolean = false) {
    if (success) {
      // Nếu upload thành công, đặt 100% ngay lập tức
      this.uploadProgress = 100;
      setTimeout(() => {
        this.uploadProgress = 0;
      }, 1000);
      return;
    }
    
    // Simulate progress cho visual feedback
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Reset progress after a short delay
        setTimeout(() => {
          this.uploadProgress = 0;
        }, 500);
      }
      this.uploadProgress = Math.min(progress, 100);
    }, 200);
  }

  // ================== Drag & Drop Methods ==================

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    this.removeDragClass();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (imageFiles.length > 0) {
        imageFiles.forEach((file, index) => {
          this.uploadAndInsertImage(file, index);
        });
      } else {
        alert('Chỉ có thể kéo thả file ảnh (PNG, JPG, GIF, etc.)');
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragEnter(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.addDragClass();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    // Only remove class if leaving the editor completely
    const rect = this.contentEditor.nativeElement.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      this.removeDragClass();
    }
  }

  private addDragClass() {
    if (this.contentEditor) {
      this.contentEditor.nativeElement.classList.add('drag-over');
    }
  }

  private removeDragClass() {
    if (this.contentEditor) {
      this.contentEditor.nativeElement.classList.remove('drag-over');
    }
  }

  // ================== Content Change Methods ==================

  onContentChange(event?: Event) {
    if (this.contentEditor) {
      // Lấy innerHTML thô và clean up CSS variables
      let content = this.contentEditor.nativeElement.innerHTML;
      
      // Loại bỏ các CSS custom properties của Tailwind
      content = this.cleanTailwindStyles(content);
      
      this.content = content;
    }
  }

  // Thêm method để clean Tailwind CSS variables
  private cleanTailwindStyles(content: string): string {
    if (!content) return '';
    
    // Loại bỏ các CSS custom properties của Tailwind
    content = content.replace(/--tw-[\w-]+:\s*[^;]*;?/g, '');
    content = content.replace(/--[\w-]+:\s*[^;]*;?/g, '');
    
    // Loại bỏ style attributes trống
    content = content.replace(/style="\s*"/g, '');
    content = content.replace(/style='\s*'/g, '');
    
    // Loại bỏ các khoảng trắng thừa
    content = content.replace(/\s+/g, ' ').trim();
    
    return content;
  }

  onPaste(event: ClipboardEvent) {
    // Handle paste events - clean up formatting
    setTimeout(() => {
      this.onContentChange();
      this.processImages();
      
      // Clean nội dung sau khi paste
      if (this.contentEditor) {
        const cleanContent = this.cleanTailwindStyles(this.contentEditor.nativeElement.innerHTML);
        this.contentEditor.nativeElement.innerHTML = cleanContent;
        this.content = cleanContent;
      }
    }, 100); // Tăng thời gian delay để đảm bảo content đã được paste hoàn toàn
  }

  onKeyDown(event: KeyboardEvent) {
    // Handle Tab key for indentation
    if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        document.execCommand('outdent', false);
      } else {
        document.execCommand('indent', false);
      }
      this.onContentChange();
    }
  }

  private processImages() {
    if (this.contentEditor) {
      const images = this.contentEditor.nativeElement.querySelectorAll('img');
      images.forEach((img: HTMLImageElement) => {
        // Ensure images have proper styling
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '0.5rem';
        img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        img.style.margin = '0.5rem 0';
        img.style.display = 'block';
      });
    }
  }

  // ================== File Management Methods ==================

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    
    // Create preview for each file
    this.selectedFiles = [];
    files.forEach(file => {
      // Validate file name length and characters
      if (file.name.length > 100) {
        alert(`Tên file "${file.name}" quá dài. Vui lòng đổi tên ngắn hơn (dưới 100 ký tự).`);
        return;
      }
      
      // Check for problematic characters
      const problematicChars = /[<>:"|?*\\]/;
      if (problematicChars.test(file.name)) {
        alert(`Tên file "${file.name}" chứa ký tự không hợp lệ. Vui lòng đổi tên file.`);
        return;
      }
      
      const fileWithPreview: FileWithPreview = file;
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          fileWithPreview.preview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
      
      this.selectedFiles.push(fileWithPreview);
    });
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Helper method to truncate HTML content if too long
  private truncateContent(content: string, maxLength: number = 60000): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    // Try to truncate at a complete HTML tag to avoid breaking HTML
    let truncated = content.substring(0, maxLength);
    const lastCompleteTag = truncated.lastIndexOf('>');
    
    if (lastCompleteTag > maxLength * 0.8) {
      truncated = content.substring(0, lastCompleteTag + 1);
    }
    
    return truncated + '...';
  }

  // ================== Update News Methods ==================

  updateNews(): void {
    if (!this.name.trim()) {
      alert('Vui lòng nhập tên tin tức');
      return;
    }
    
    if (!this.shortDescription.trim()) {
      alert('Vui lòng nhập mô tả ngắn');
      return;
    }
    
    if (!this.content.trim() || this.content === '<p><br></p>' || this.content === '<br>') {
      alert('Vui lòng nhập nội dung chi tiết');
      return;
    }

    const newsDTO: NewsDTO = {
      name: this.name.trim(),
      shortDescription: this.shortDescription.trim(),
      content: this.content,  // No truncation for testing
      isMain: this.isMain // Add isMain field
    };

    // Log content length for debugging
    console.log('Content length:', this.content.length);

    this.newsService.updateNews(this.newId, newsDTO).subscribe({
      next: () => {
        alert('Cập nhật tin tức thành công!');
        this.router.navigate(['/admin/news']);
      },
      error: (error: HttpErrorResponse) => {
        const errorMessage = error.error?.message || error.message;
        alert(`Lỗi khi cập nhật: ${errorMessage}`);
        console.error('Update news error:', error);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/news']);
  }
}
