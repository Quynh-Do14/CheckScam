import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubjectDetailResponse {
  status: string;
  message: string;
  data: SubjectDetail;
}

export interface SubjectDetail {
  info: string;
  type: number;
  name: string;
  description: string;
  totalScamAmount: number;
  reportCount: number;
  lastReportDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  evidenceImages: string[];
  reports: ReportItem[];
  relatedSubjects: RelatedSubject[];
}

export interface ReportItem {
  id: number;
  date: string;
  description: string;
  amount: number;
  reporterLocation: string;
  status: string;
}

export interface RelatedSubject {
  info: string;
  type: number;
  description: string;
  riskLevel: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubjectDetailService {

  private baseUrl = 'http://localhost:8080/api/v1'; // Hard-coded URL

  constructor(private http: HttpClient) { }

  getSubjectDetail(info: string, type: number = 1): Observable<SubjectDetailResponse> {
    return this.http.get<SubjectDetailResponse>(
      `${this.baseUrl}/ranking/subject-detail/${encodeURIComponent(info)}?type=${type}`
    );
  }

  incrementViewCount(info: string, type: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/ranking/increment-view`, {
      info: info,
      type: type
    });
  }

  testDatabase(): Observable<any> {
    return this.http.get(`${this.baseUrl}/ranking/test-db`);
  }

  testSpecificInfo(info: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/ranking/test-data/${encodeURIComponent(info)}`);
  }
}