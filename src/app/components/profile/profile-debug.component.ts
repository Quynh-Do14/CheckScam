import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="alert alert-warning" *ngIf="error">
        <strong>Error:</strong> {{error}}
      </div>
      
      <div class="alert alert-info" *ngIf="loading">
        <strong>Loading...</strong> Đang tải thông tin...
      </div>
      
      <div *ngIf="!loading && !error">
        <h1>🔍 Profile Debug Info</h1>
        
        <div class="card mb-3">
          <div class="card-header">LocalStorage Info</div>
          <div class="card-body">
            <p><strong>Has JWT Token:</strong> {{hasToken}}</p>
            <p><strong>User Data:</strong></p>
            <pre>{{localStorageUser | json}}</pre>
          </div>
        </div>
        
        <div class="card mb-3" *ngIf="apiResponse">
          <div class="card-header">API Response</div>
          <div class="card-body">
            <pre>{{apiResponse | json}}</pre>
          </div>
        </div>
        
        <div class="card mb-3" *ngIf="processedUser">
          <div class="card-header">Processed User Data</div>
          <div class="card-body">
            <p><strong>ID:</strong> {{processedUser.id}}</p>
            <p><strong>Name:</strong> {{processedUser.name}}</p>
            <p><strong>Email:</strong> {{processedUser.email}}</p>
            <p><strong>Role:</strong> {{processedUser.role}}</p>
            <p><strong>Avatar:</strong> {{processedUser.avatar}}</p>
            <p><strong>Description:</strong> {{processedUser.description}}</p>
          </div>
        </div>
      </div>
      
      <button class="btn btn-primary" (click)="loadProfile()">🔄 Reload Profile</button>
      <button class="btn btn-secondary ml-2" (click)="goBack()">← Back</button>
    </div>
  `,
  styles: [`
    .container-fluid { padding: 20px; }
    pre { background: #f8f9fa; padding: 10px; border-radius: 5px; }
    .card { margin-bottom: 1rem; }
  `]
})
export class ProfileDebugComponent implements OnInit {
  loading = false;
  error = '';
  hasToken = false;
  localStorageUser: any = null;
  apiResponse: any = null;
  processedUser: any = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkLocalStorage();
    this.loadProfile();
  }

  checkLocalStorage() {
    const token = localStorage.getItem('jwt_token');
    const userData = localStorage.getItem('user');
    
    this.hasToken = !!token;
    this.localStorageUser = userData ? JSON.parse(userData) : null;
    
    console.log('🔍 LocalStorage Check:', {
      hasToken: this.hasToken,
      userData: this.localStorageUser
    });
  }

  loadProfile() {
    this.loading = true;
    this.error = '';
    this.apiResponse = null;
    this.processedUser = null;

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      this.error = 'No JWT token found';
      this.loading = false;
      return;
    }

    const userData = localStorage.getItem('user');
    if (!userData) {
      this.error = 'No user data found in localStorage';
      this.loading = false;
      return;
    }

    let user;
    try {
      user = JSON.parse(userData);
    } catch (e) {
      this.error = 'Invalid user data in localStorage';
      this.loading = false;
      return;
    }

    if (!user.id) {
      this.error = 'No user ID found in localStorage';
      this.loading = false;
      return;
    }

    console.log('🚀 Making API call to:', `${environment.apiBaseUrl}/users/${user.id}`);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept-Language': 'vi'
    };

    console.log('📋 Request headers:', headers);

    this.http.get(`${environment.apiBaseUrl}/users/${user.id}`, { headers }).subscribe({
      next: (response: any) => {
        console.log('✅ API Response received:', response);
        this.apiResponse = response;
        
        // Process the response
        const userData = response.data || response;
        this.processedUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.roles || userData.role || [],
          avatar: userData.avatar,
          description: userData.description,
          profiles: userData.profiles || []
        };
        
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ API Error:', error);
        this.error = `API Error: ${error.status} - ${error.message || 'Unknown error'}`;
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
  }
}