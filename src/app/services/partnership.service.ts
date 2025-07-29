import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PartnershipRequest {
  name: string;
  email: string;
  organization: string;
  phoneNumber?: string;
  packageType: string;
  message?: string;
}

export interface PartnershipResponse {
  status: string;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PartnershipService {
  private apiUrl = `${environment.apiUrl}/api/v1/partnerships`;

  constructor(private http: HttpClient) {}

  registerPartnership(request: PartnershipRequest): Observable<PartnershipResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post<PartnershipResponse>(
      `${this.apiUrl}/register`,
      request,
      { headers }
    );
  }

}