import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface CooperateRegisterRequest { 
  name: string;
  email: string;
  phoneNumber: string;
}

export interface CooperateRegisterResponse {
  status: string; 
  message: string; 
  data?: any; 
}

@Injectable({
  providedIn: 'root'
})
export class CooperateService {
  private readonly API_URL = `${environment.apiUrl}/api/v1/service/register`;

  constructor(private http: HttpClient) { }

  /**
   * @param cooperateData 
   * @returns 
   */
  registerCooperate(cooperateData: CooperateRegisterRequest): Observable<CooperateRegisterResponse> { 
    console.log('Sending cooperation registration payload to backend:', cooperateData);
    return this.http.post<CooperateRegisterResponse>(this.API_URL, cooperateData);
  }
}