import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { NewsService } from '../../services/news.service';
import { NewsDTO } from '../../dtos/news.dto';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss']
})
export class NewsComponent implements OnInit {
  /* danh sách */
  posts: any[] = [];

  /* popup state + form */
  isPopupVisible = false;
  name = '';
  shortDescription = '';
  content = '';
  selectedFile: File | null = null;


  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private newsService: NewsService,
    private router: Router
  ) {}

  /* ---------- lifecycle ---------- */
  ngOnInit(): void { this.loadAllNews(); }

  /* ---------- lấy danh sách ---------- */
  private loadAllNews(): void {
    this.newsService.getListNews().subscribe({
      next: res => (this.posts = res),
      error: err => alert(err.error || 'Không lấy được danh sách')
    });
  }

  /* ---------- xóa ---------- */
  deleteNews(id: number): void {
    if (!confirm('Bạn có chắc muốn xóa bài đăng này?')) { return; }

    console.log('🗑️ Bắt đầu xóa tin tức ID:', id);
    this.newsService.deleteNewsById(id).subscribe({
      next: (response) => {
        console.log('✅ Xóa thành công:', response);
        alert('Xóa tin tức thành công!');
        this.loadAllNews();
      },
      error: (err) => {
        console.error('❌ Lỗi xóa tin tức:', err);
        const errorMessage = err.error?.message || err.message || 'Xóa thất bại';
        alert('Lỗi xóa tin tức: ' + errorMessage);
      }
    });
  }

  /* ---------- popup ---------- */
  togglePopup(): void {
    this.isPopupVisible = !this.isPopupVisible;

    if (!this.isPopupVisible) {
      /* reset form khi đóng */
      this.name = this.shortDescription = this.content = '';
      this.selectedFile = null;
      if (this.fileInput) { this.fileInput.nativeElement.value = ''; }
    }
  }
  openAssignPopup(): void { this.togglePopup(); }

  closePopup(evt: MouseEvent): void {
    if ((evt.target as HTMLElement).classList.contains('popup-overlay')) {
      this.togglePopup();
    }
  }

  /* ---------- file ---------- */
  onFileSelect(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    this.selectedFile = input.files && input.files[0] ? input.files[0] : null;
  }

  /* ---------- tạo tin ---------- */
  createNews(): void {
    const dto: NewsDTO = {
      name: this.name,
      shortDescription: this.shortDescription,
      content: this.content
    };

    this.newsService.createNews(dto).subscribe({
      next: res => {
        const id = res?.data?.id ?? res?.id;
        if (!id) { alert('Không nhận được ID bài viết'); return; }

        if (this.selectedFile) {
          this.uploadFile(id);
        } else {
          alert('Tạo bài viết thành công!');
          this.afterCreate();
        }
      },
      error: (e: HttpErrorResponse) =>
        alert(e.error?.message || 'Tạo bài viết thất bại')
    });
  }

  private uploadFile(newsId: number | string): void {
    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('files', this.selectedFile, this.selectedFile.name);
    }

    this.newsService.uploadFiles(newsId, formData).subscribe({
      next: () => {
        alert('Tạo bài viết & upload ảnh thành công!');
        this.afterCreate();
      },
      error: (e: HttpErrorResponse) =>
        alert(e.error?.message || 'Upload ảnh thất bại')
    });
  }

  private afterCreate(): void {
    this.togglePopup();
    this.loadAllNews();
  }

  /* ---------- navigation ---------- */
  goToNewsDetail(id: number): void {
    this.router.navigate(['/admin/detail-news', id]);
  }
}