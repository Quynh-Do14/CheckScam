
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { map } from 'rxjs/operators';


export enum MistakeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface MistakeDetailResponse {
  id: number;
  type: string;
  info: string;
}

export interface Mistake {
  id: number;
  emailAuthorMistake: string;
  complaintReason: string;
  // Sử dụng enum MistakeStatus cho thuộc tính status
  status: MistakeStatus;
  dateMistake: string;
  mistakeDetails: MistakeDetailResponse[];
  attachmentUrls: string[];
}

export interface ApiResponse<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: any;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MistakeService {
  private apiUrl = environment.apiUrl + '/mistakes';

  constructor(private http: HttpClient) { }

  getMistakes(page: number, size: number, status: string = ''): Observable<ApiResponse<Mistake>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status.toUpperCase());
    }

    return this.http.get<ApiResponse<Mistake>>(`${this.apiUrl}`, { params }).pipe(
      map(response => {
        return response;
      })
    );
  }

  getMistakeById(id: number): Observable<Mistake> {
    return this.http.get<Mistake>(`${this.apiUrl}/${id}`);
  }

  approveMistake(mistakeId: number): Observable<Mistake> {
    return this.http.patch<Mistake>(`${this.apiUrl}/approve/${mistakeId}`, {});
  }

  rejectMistake(mistakeId: number): Observable<Mistake> {
    return this.http.patch<Mistake>(`${this.apiUrl}/reject/${mistakeId}`, {});
  }

  getMistakeStatusString(status: MistakeStatus): string {
    switch (status) {
      case MistakeStatus.PENDING: return 'Đang chờ xử lý';
      case MistakeStatus.APPROVED: return 'Đã duyệt';
      case MistakeStatus.REJECTED: return 'Đã từ chối';
      default: return 'Không xác định'; 
    }
  }

  getMistakeDetailInfo(mistakeDetails: MistakeDetailResponse[] | undefined): string {
    if (!mistakeDetails || mistakeDetails.length === 0) {
      return 'Không có';
    }
    return mistakeDetails.map(d => `${d.type}: ${d.info}`).join('; ');
  }

  getAttachmentUrlsPreview(attachmentUrls: string[] | undefined): string {
    if (!attachmentUrls || attachmentUrls.length === 0) {
      return 'Không có';
    }
    return `Có ${attachmentUrls.length} ảnh`;
  }
}