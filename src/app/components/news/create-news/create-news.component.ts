import { CommonModule, NgIf, NgFor, NgSwitch, NgSwitchCase, DecimalPipe } from '@angular/common'; 
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router'; 

import { NewsService } from '../../../services/news.service';
import { NewsDTO } from '../../../dtos/news.dto';
import { environment } from '../../../environments/environment';

interface FileWithPreview extends File {
  preview?: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
  tag: string;
}

@Component({
  selector: 'app-create-news',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    HttpClientModule,
    NgIf,
    NgFor,
    NgSwitch,
    NgSwitchCase,

  ],
  providers: [], 
  templateUrl: './create-news.component.html',
  styleUrls: ['./create-news.component.scss']
})
export class CreateNewsComponent implements OnInit, AfterViewInit {
  name = '';
  shortDescription = '';
  content = ''; 
  selectedFiles: FileWithPreview[] = [];
  uploadProgress = 0;
  isMain = false; // Thêm field cho checkbox tin chính
  
  // Word-style properties
  wordStyleEnabled = false;
  autoNumberingEnabled = true;
  documentStyle = 'word'; // 'word', 'web', 'academic'
  tableOfContents: TocItem[] = [];
  showTableOfContents = false;
  
  @ViewChild('contentEditor', { static: false }) contentEditor!: ElementRef;
  @ViewChild('imageInput', { static: false }) imageInput!: ElementRef;

  constructor(
    private newsService: NewsService,
    private router: Router
  ) {}

  ngOnInit() {
    // Initialize with empty content
    this.content = '';
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
      
      // Apply default Word style
      this.wordStyleEnabled = true;
      this.applyDocumentStyle();
    }
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
      
      // Cập nhật mục lục
      this.tableOfContents = this.generateTableOfContents();
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

  // ================== News Creation Methods ==================

  createNews(): void {
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

    const dto: NewsDTO = {
      name: this.name.trim(),
      shortDescription: this.shortDescription.trim(),
      content: this.truncateContent(this.content, 60000),  // Larger limit
      isMain: this.isMain // Thêm field tin chính
    };

    // Log content length for debugging
    console.log('Content length:', this.content.length);

    console.log('Creating news directly with main endpoint...');
    this.newsService.createNews(dto).subscribe({
      next: res => {
        console.log('Create news success:', res);
        this.handleCreateNewsSuccess(res);
      },
      error: (err: HttpErrorResponse) => {
        const errorMessage = err.error?.message || err.message;
        alert(`Lỗi khi tạo bài viết: ${errorMessage}`);
        console.error('Create news error:', err);
      }
    });
  }

  private handleCreateNewsSuccess(res: any): void {
    const id = res?.data?.id || res?.id; 
    if (!id) {
      alert('Không nhận được ID bài viết từ server');
      return;
    }

    if (this.selectedFiles.length) {
      this.uploadFiles(id);
    } else {
      alert('Tạo bài viết thành công!');
      this.router.navigate(['/admin/news']); 
    }
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

  private uploadFiles(newsId: number | string): void {
    const formData = new FormData();
    this.selectedFiles.forEach(f => formData.append('files', f, f.name));

    this.uploadProgress = 0;
    
    this.newsService.uploadFiles(newsId, formData).subscribe({
      next: () => {
        this.uploadProgress = 100;
        setTimeout(() => {
          alert('Tạo bài viết & tải ảnh thành công!');
          this.router.navigate(['/admin/news']); 
        }, 500);
      },
      error: (err: HttpErrorResponse) => {
        this.uploadProgress = 0;
        const errorMessage = err.error?.message || err.message;
        alert(`Lỗi upload: ${errorMessage}`);
      }
    });
  }

  // ================== Word Style & Table of Contents Methods ==================

  /**
   * Toggle Word document styling
   */
  toggleWordStyle() {
    this.wordStyleEnabled = !this.wordStyleEnabled;
    this.applyDocumentStyle();
  }

  /**
   * Toggle auto numbering cho headings
   */
  toggleAutoNumbering() {
    this.autoNumberingEnabled = !this.autoNumberingEnabled;
    this.applyDocumentStyle();
  }

  /**
   * Thay đổi style tài liệu
   */
  changeDocumentStyle(style: string) {
    this.documentStyle = style;
    this.applyDocumentStyle();
  }

  /**
   * Apply document style
   */
  private applyDocumentStyle() {
    if (!this.contentEditor) return;
    
    const editor = this.contentEditor.nativeElement;
    
    // Remove all existing style classes
    editor.classList.remove('word-style', 'web-style', 'academic-style', 'no-numbering');
    
    // Apply selected style
    if (this.wordStyleEnabled) {
      switch (this.documentStyle) {
        case 'word':
          editor.classList.add('word-style');
          break;
        case 'academic':
          editor.classList.add('academic-style');
          break;
        case 'web':
        default:
          editor.classList.add('web-style');
          break;
      }
      
      // Apply numbering setting
      if (!this.autoNumberingEnabled) {
        editor.classList.add('no-numbering');
      }
    }
  }

  /**
   * Tạo mục lục từ nội dung HTML
   */
  generateTableOfContents(): TocItem[] {
    if (!this.contentEditor) return [];
    
    // Lấy nội dung trực tiếp từ editor
    const editorContent = this.contentEditor.nativeElement.innerHTML;
    if (!editorContent || editorContent.trim() === '') return [];
    
    // Tìm tất cả các thẻ heading trong editor
    const headings = this.contentEditor.nativeElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const toc: TocItem[] = [];
    
    headings.forEach((heading: HTMLElement, index: number) => {
      const text = heading.textContent?.trim() || '';
      if (text) {
        // Tạo ID duy nhất cho heading
        const id = this.generateHeadingId(text, index);
        
        // Thêm ID vào heading nếu chưa có
        if (!heading.id) {
          heading.id = id;
        }
        
        toc.push({
          id: heading.id || id,
          text: text,
          level: parseInt(heading.tagName.charAt(1)), // Lấy số từ h1, h2, etc.
          tag: heading.tagName.toLowerCase()
        });
      }
    });
    
    console.log('Generated TOC:', toc); // Debug log
    return toc;
  }

  /**
   * Tạo ID duy nhất cho heading
   */
  private generateHeadingId(text: string, index: number): string {
    // Chuyển text thành slug
    const slug = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
      .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự đặc biệt
      .trim()
      .replace(/\s+/g, '-') // Thay space bằng dấu gạch ngang
      .replace(/-+/g, '-'); // Loại bỏ dấu gạch ngang thừa
    
    return `heading-${index}-${slug}`;
  }

  /**
   * Cuộn đến heading được chọn trong mục lục
   */
  scrollToHeading(headingId: string) {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // Highlight heading temporarily
      element.style.backgroundColor = '#fff3cd';
      element.style.transition = 'background-color 0.3s ease';
      
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 2000);
    }
  }

  /**
   * Debug function để kiểm tra mục lục
   */
  debugTableOfContents() {
    console.log('=== DEBUG TABLE OF CONTENTS ===');
    console.log('contentEditor:', !!this.contentEditor);
    
    if (this.contentEditor) {
      console.log('Editor innerHTML:', this.contentEditor.nativeElement.innerHTML);
      
      const headings = this.contentEditor.nativeElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
      console.log('Found headings:', headings.length);
      
      headings.forEach((heading: HTMLElement, index: number) => {
        console.log(`Heading ${index + 1}:`, {
          tagName: heading.tagName,
          textContent: heading.textContent,
          id: heading.id,
          classes: heading.className
        });
      });
    }
    
    console.log('Word style enabled:', this.wordStyleEnabled);
    console.log('Document style:', this.documentStyle);
    console.log('Show TOC:', this.showTableOfContents);
    console.log('TOC items:', this.tableOfContents);
    console.log('=== END DEBUG ===');
    
    // Force generate TOC
    this.tableOfContents = this.generateTableOfContents();
    this.showTableOfContents = true;
  }

  /**
   * Toggle hiển thị mục lục
   */
  toggleTableOfContents() {
    this.showTableOfContents = !this.showTableOfContents;
    console.log('Toggle TOC:', this.showTableOfContents); // Debug log
    
    if (this.showTableOfContents) {
      this.tableOfContents = this.generateTableOfContents();
      console.log('TOC items:', this.tableOfContents); // Debug log
    }
  }

  /**
   * Thêm outline numbering cho headings hiện có
   */
  addOutlineNumbering() {
    if (!this.contentEditor) return;
    
    const headings = this.contentEditor.nativeElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const counters = [0, 0, 0, 0, 0, 0]; // Counter cho h1-h6
    
    headings.forEach((heading: HTMLElement) => {
      const level = parseInt(heading.tagName.charAt(1)) - 1; // 0-5 for h1-h6
      
      // Reset counters for lower levels
      for (let i = level + 1; i < 6; i++) {
        counters[i] = 0;
      }
      
      // Increment current level
      counters[level]++;
      
      // Create numbering string
      let numbering = '';
      for (let i = 0; i <= level; i++) {
        if (counters[i] > 0) {
          numbering += (numbering ? '.' : '') + counters[i];
        }
      }
      
      // Add numbering to heading text if not already present
      const text = heading.textContent || '';
      const hasNumbering = /^\d+(\.\d+)*\.?\s/.test(text);
      
      if (!hasNumbering && numbering) {
        heading.textContent = numbering + '. ' + text;
      }
    });
    
    this.onContentChange();
  }

  /**
   * Remove numbering từ headings
   */
  removeNumbering() {
    if (!this.contentEditor) return;
    
    const headings = this.contentEditor.nativeElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach((heading: HTMLElement) => {
      const text = heading.textContent || '';
      // Remove numbering pattern like "1.2.3. " or "1. "
      const cleanText = text.replace(/^\d+(\.\d+)*\.?\s/, '');
      heading.textContent = cleanText;
    });
    
    this.onContentChange();
  }

  /**
   * Apply Word template
   */
  applyWordTemplate() {
    if (!this.contentEditor) return;
    
    const template = `
      <h1>Giới thiệu</h1>
      <p>Đây là đoạn văn mở đầu cho phần giới thiệu. Nội dung được định dạng theo chuẩn Microsoft Word với font Calibri và spacing chuẩn.</p>
      
      <h2>Mục tiêu</h2>
      <p>Mô tả mục tiêu của tài liệu hoặc dự án.</p>
      
      <h2>Phạm vi</h2>
      <p>Xác định phạm vi áp dụng của tài liệu.</p>
      
      <h1>Nội dung chính</h1>
      <p>Phần nội dung chính của tài liệu.</p>
      
      <h2>Phân tích</h2>
      <p>Nội dung phân tích chi tiết.</p>
      
      <h3>Phân tích kỹ thuật</h3>
      <p>Chi tiết về các khía cạnh kỹ thuật.</p>
      
      <h3>Phân tích nghiệp vụ</h3>
      <p>Chi tiết về các khía cạnh nghiệp vụ.</p>
      
      <h2>Đề xuất giải pháp</h2>
      <p>Các đề xuất và khuyến nghị.</p>
      
      <h1>Kết luận</h1>
      <p>Tóm tắt và kết luận của tài liệu.</p>
    `;
    
    this.contentEditor.nativeElement.innerHTML = template;
    this.wordStyleEnabled = true;
    this.applyDocumentStyle();
    this.onContentChange();
    
    // Tự động hiển thị mục lục sau khi áp dụng template
    setTimeout(() => {
      this.showTableOfContents = true;
      this.tableOfContents = this.generateTableOfContents();
    }, 100);
  }
}
