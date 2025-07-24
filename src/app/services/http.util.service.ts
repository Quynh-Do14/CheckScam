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
    
    // 🔧 OPTIONAL: Chỉ thêm Authorization nếu có token
    // Nếu API không yêu cầu authentication, có thể bỏ qua phần này
    const token = localStorage.getItem('jwt_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 🔧 ALTERNATIVE: Nếu API yêu cầu API key thay vì JWT
    // headers['X-API-Key'] = 'your-api-key-here';
    
    return new HttpHeaders(headers);
  }
  
  // 🔧 FALLBACK: Headers không có authentication cho các API public
  createPublicHeaders(setContentType: boolean = true): HttpHeaders {
    const headers: any = {
      'Accept-Language': 'vi',
    };
    
    if (setContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    return new HttpHeaders(headers);
  }
}
