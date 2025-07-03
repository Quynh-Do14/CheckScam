import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { HttpUtilService } from './http.util.service';

export interface TopScamItem {
  id: number;
  info: string; // phone number, bank account, or URL
  description: string;
  verifiedCount: number; // số lượt báo cáo
  viewCount: number; // số lượt xem
  lastReportAt: string;
  status: 'danger' | 'warning' | 'safe';
  type: 'phone' | 'bank' | 'url';
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface TopScamResponse {
  phones: TopScamItem[];
  banks: TopScamItem[];
  urls: TopScamItem[];
}

@Injectable({
  providedIn: 'root'
})
export class TopScamService {
  private apiRanking = `${environment.apiBaseUrl}/ranking`;

  constructor(
    private http: HttpClient,
    private httpUtilService: HttpUtilService
  ) { }

  private getApiConfig() {
    return {
      headers: this.httpUtilService.createHeaders(),
    };
  }

  // Get top phones by view count
  getTopPhones(): Observable<ApiResponse<TopScamItem[]>> {
    return this.http.get<ApiResponse<TopScamItem[]>>(`${this.apiRanking}/top-phones`, this.getApiConfig());
  }

  // Get top banks by view count
  getTopBanks(): Observable<ApiResponse<TopScamItem[]>> {
    return this.http.get<ApiResponse<TopScamItem[]>>(`${this.apiRanking}/top-banks`, this.getApiConfig());
  }

  // Get top URLs by view count
  getTopUrls(): Observable<ApiResponse<TopScamItem[]>> {
    return this.http.get<ApiResponse<TopScamItem[]>>(`${this.apiRanking}/top-urls`, this.getApiConfig());
  }

  // Get all top scams in one call
  getTopAll(): Observable<ApiResponse<TopScamResponse>> {
    return this.http.get<ApiResponse<TopScamResponse>>(`${this.apiRanking}/top-all`, this.getApiConfig());
  }

  // Increment view count when user searches
  incrementViewCount(info: string, type: number): Observable<ApiResponse<any>> {
    const params = { info, type: type.toString() };
    return this.http.post<ApiResponse<any>>(`${this.apiRanking}/increment-view`, null, {
      ...this.getApiConfig(),
      params
    });
  }
}
