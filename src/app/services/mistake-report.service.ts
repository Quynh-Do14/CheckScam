import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

// *** THAY ĐỔI Ở ĐÂY: Đổi 'typeToComplain' thành 'type' ***
interface MistakeDetailFrontendRequest {
  type: 1 | 2 | 3; // <-- Đã đổi tên
  info: string;
  info2?: string;
  info3?: string;
}

interface MistakeFrontendRequest {
  emailAuthorMistake: string;
  complaintReason: string;
  mistakeDetails: MistakeDetailFrontendRequest[];
  captchaToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class MistakeReportService {

  private apiUrl = environment.apiBaseUrl + '/mistakes'; 

  constructor(private http: HttpClient) { }

  createMistakeReport(payload: MistakeFrontendRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  uploadFiles(mistakeId: number | string, formData: FormData): Observable<any> { 
    return this.http.post<any>(`${this.apiUrl}/uploads/${mistakeId}`, formData);
  }

}