import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpUtilService } from './http.util.service';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { CreateReportRequestDTO } from '../dtos/create-report-request.dto';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiBaseUrl = environment.apiBaseUrl;
  private apiReportEndpoint = `${this.apiBaseUrl}/report`;

  constructor(
    private http: HttpClient,
    private httpUtilService: HttpUtilService
  ) { }

  private getApiConfig() {
    return {
      headers: this.httpUtilService.createHeaders(),
    };
  }

  createReportUnified(payload: CreateReportRequestDTO): Observable<any> {
    return this.http.post(this.apiReportEndpoint, payload, this.getApiConfig());
  }

  getListReports(page: number = 0, size: number = 10, statusFilter: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (statusFilter) {
      params = params.set('status', statusFilter);
    }
    
    return this.http.get<any>(`${this.apiBaseUrl}/report/all`, { params, ...this.getApiConfig() });
  }

  getReportById(id: number): Observable<any> {
    return this.http.get(`${this.apiBaseUrl}/report/${id}`, this.getApiConfig());
  }

  uploadFiles(reportId: number | string, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file, file.name);
    });
    return this.http.post<any>(`${this.apiBaseUrl}/report/uploads/${reportId}`, formData);
  }
  
  // Sửa phương thức approveReport để không cần scamTypeId và gửi body rỗng
  approveReport(reportId: number): Observable<any> {
    return this.http.patch(`${this.apiReportEndpoint}/approve/${reportId}`, {}, this.getApiConfig());
  }

  rejectReport(reportId: number): Observable<any> {
    return this.http.patch(`${this.apiReportEndpoint}/reject/${reportId}`, {}, this.getApiConfig());
  }

  getMonthlyStats(year: number): Observable<any[]> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get<any[]>(`${this.apiBaseUrl}/report/monthly`, { params, ...this.getApiConfig() });
  }

  getYearlyStats(): Observable<{ year: number; count: number }[]> {
    return this.http.get<{ year: number; count: number }[]>(
      `${this.apiBaseUrl}/report/yearly`, this.getApiConfig()
    );
  }

  getUserReports(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/report/user/${userId}`, this.getApiConfig());
  }
}