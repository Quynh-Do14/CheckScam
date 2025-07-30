import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Short {
  id?: number;
  title: string;
  thumbnail?: string;
  videoUrl?: string;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShortService {
  private apiUrl = `${environment.apiBaseUrl}/shorts`;

  constructor(private http: HttpClient) {}

  getAllShorts(): Observable<Short[]> {
    return this.http.get<Short[]>(this.apiUrl);
  }

  getShortById(id: number): Observable<Short> {
    return this.http.get<Short>(`${this.apiUrl}/${id}`);
  }

  createShort(title: string, file: File, thumbnail: File): Observable<Short> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    formData.append('thumbnail', thumbnail);
    
    return this.http.post<Short>(this.apiUrl, formData);
  }

  updateShort(id: number, title: string, file?: File, thumbnail?: File): Observable<Short> {
    const formData = new FormData();
    formData.append('title', title);
    
    if (file) {
      formData.append('file', file);
    }
    
    if (thumbnail) {
      formData.append('thumbnail', thumbnail);
    }
    
    return this.http.put<Short>(`${this.apiUrl}/${id}`, formData);
  }

  deleteShort(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  incrementViews(id: number): Observable<Short> {
    return this.http.post<Short>(`${this.apiUrl}/${id}/view`, {});
  }

  getVideoUrl(filename: string): string {
    return `${environment.apiBaseUrl}/shorts/videos/${filename}`;
  }
  
  getThumbnailUrl(filename: string): string {
    return `${environment.apiBaseUrl}/shorts/thumbnails/${filename}`;
  }

  // Helper method to extract filename from full path
  extractFilename(path: string): string {
    if (!path) return '';
    return path.split('/').pop() || '';
  }

  // Get video URL from full path
  getVideoUrlFromPath(videoPath: string): string {
    const filename = this.extractFilename(videoPath);
    return this.getVideoUrl(filename);
  }

  // Get thumbnail URL from full path
  getThumbnailUrlFromPath(thumbnailPath: string): string {
    const filename = this.extractFilename(thumbnailPath);
    return this.getThumbnailUrl(filename);
  }

  // Validate file size
  validateFileSize(file: File, maxSizeMB: number): boolean {
    return file.size <= maxSizeMB * 1024 * 1024;
  }

  // Validate video file format
  validateVideoFormat(file: File): boolean {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
    return allowedTypes.includes(file.type);
  }

  // Validate image file format
  validateImageFormat(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(file.type);
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 