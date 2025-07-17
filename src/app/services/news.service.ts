import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpUtilService } from './http.util.service';
import { Observable } from 'rxjs';
import { NewsDTO } from '../dtos/news.dto';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private apiNews = `${environment.apiBaseUrl}/news`;
  private apiUpdateNews = `${environment.apiBaseUrl}/news`;

  constructor(
    private http: HttpClient,
    private httpUtilService: HttpUtilService
  ) { }

  private getApiConfig() {
    return {
      headers: this.httpUtilService.createHeaders(),
    };
  }

  private getMultipartApiConfig() {
    const token = localStorage.getItem('jwt_token');
    return {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': 'vi'
        // Đặc biệt không set Content-Type cho multipart/form-data
        // Browser sẽ tự động set kèm boundary
      }
    };
  }

  getAllNews(page: number = 0, size: number = 5): Observable<any> { 

    return this.http.get<any>(`${this.apiNews}?page=${page}&size=${size}`);
  }

  getListNews(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/news`);
  }

  getNewsById(id: number): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/news/${id}`);
  }

  createNews(newsDTO: NewsDTO): Observable<any> {
    console.log('Sending news data:', newsDTO);
    console.log('API URL:', this.apiNews);
    
    const token = localStorage.getItem('jwt_token');
    console.log('JWT Token exists:', !!token);
    console.log('Token value:', token ? token.substring(0, 50) + '...' : 'null');
    
    return this.http.post(this.apiNews, newsDTO, this.getApiConfig());
  }

  createNewsTest(newsDTO: NewsDTO): Observable<any> {
    console.log('Testing news creation without auth...');
    return this.http.post(`${this.apiNews}/test`, newsDTO);
  }

  deleteNewsById(id: number): Observable<any> {
    return this.http.delete(`${environment.apiBaseUrl}/news/${id}`);
  }

  uploadFiles(newsId: number | string, formData: FormData): Observable<any> {
    return this.http.post<any>(
      `${environment.apiBaseUrl}/news/uploads/${newsId}`, 
      formData, 
      this.getMultipartApiConfig()  // Fix luôn cho attachments
    );
  }

  updateNews(id: number,newsDTO: NewsDTO): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/news/${id}`, newsDTO);
  }

  // Lấy tin chính
  getMainNews(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/news/main`);
  }

  // Lấy tin thường (không phải tin chính)
  getRegularNews(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/news/regular`);
  }

  // ===== NEW APIs - Upload Content Images =====

  /**
   * Upload 1 ảnh để sử dụng trong content HTML
   * Response: { fileName, url, fullUrl, htmlTag }
   */
  uploadContentImage(image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    
    console.log('Uploading content image:', image.name);
    console.log('FormData created:', formData.has('image'));
    
    return this.http.post<any>(
      `${environment.apiBaseUrl}/news/content-image`, 
      formData, 
      this.getMultipartApiConfig()  // Sử dụng config cho multipart
    );
  }

  /**
   * Upload nhiều ảnh cùng lúc cho content
   * Response: { count, images: [{ fileName, url, originalName, htmlTag }] }
   */
  uploadContentImages(images: File[]): Observable<any> {
    const formData = new FormData();
    images.forEach(image => {
      formData.append('images', image);
    });
    
    console.log('Uploading multiple content images:', images.length);
    return this.http.post<any>(
      `${environment.apiBaseUrl}/news/content-images`, 
      formData, 
      this.getMultipartApiConfig()  // Sử dụng config cho multipart
    );
  }

 
  getImageUrl(fileName: string): string {
    if (!fileName) return '';
    
    // Lấy từ environment cho flexibility
    return `${environment.apiUrl}/api/v1/news/image/${fileName}`;
  }

  /**
   * Kiểm tra ảnh có tồn tại không (optional)
   */
  checkImageExists(fileName: string): Observable<any> {
    const url = this.getImageUrl(fileName);
    return this.http.head(url, { observe: 'response' });
  }

  /**
   * Preview ảnh theo fileName
   */
  previewImage(fileName: string): string {
    return this.getImageUrl(fileName);
  }
}
