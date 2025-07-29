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

  updateShort(id: number, shortData: Short): Observable<Short> {
    return this.http.put<Short>(`${this.apiUrl}/${id}`, shortData);
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
} 