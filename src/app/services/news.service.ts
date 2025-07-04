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
    return this.http.post<any>(`${environment.apiBaseUrl}/news/uploads/${newsId}`, formData);
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
}
