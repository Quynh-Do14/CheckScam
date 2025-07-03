import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class HttpUtilService {
  createHeaders(setContentType: boolean = true): HttpHeaders {
    const headers: any = {
      'Accept-Language': 'vi',
    };
    
    if (setContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    const token = localStorage.getItem('jwt_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return new HttpHeaders(headers);
  }
}
