import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpUtilService } from './http.util.service';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs'; 
import { LoginDTO } from '../dtos/login.dto';
import { environment } from '../environments/environment';
import { UpdateProfileDTO, UserProfileDTO, ProfileResponseDTO, UpdateUserDTO } from '../dtos/profile.dto'; 
import { UserDTO } from '../dtos/user.dto'; 
import { RegisterDTO } from '../dtos/register.dto';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiLogin = `${environment.apiBaseUrl}/auth/login`;
  private apiRegister = `${environment.apiBaseUrl}/auth/register`;
  private apiCreateUser = `${environment.apiBaseUrl}/users`;
  private apiUpdateUserEndpoint = `${environment.apiBaseUrl}/users`;
  private apiGetProfile = `${environment.apiBaseUrl}/users`;
  private apiCreateProfile = `${environment.apiBaseUrl}/users`;
  private apiUpdateProfile = `${environment.apiBaseUrl}/users/profiles`;
  private apiDeleteProfile = `${environment.apiBaseUrl}/users/profiles`;
  private apiLogout = `${environment.apiBaseUrl}/auth/logout`;
  private apiGoogleLogin = `${environment.apiBaseUrl}/auth/google`;
  private apiForgotPassword = `${environment.apiBaseUrl}/auth/forgot-password`;
  private apiResetPassword = `${environment.apiBaseUrl}/auth/reset-password`;

  private _isLoggedIn = new BehaviorSubject<boolean>(this.hasToken());
  authStatus$: Observable<boolean> = this._isLoggedIn.asObservable();

  private _currentUserData = new BehaviorSubject<any>(this.getUserData()); 
  currentUserData$: Observable<any> = this._currentUserData.asObservable();

  constructor(
    private http: HttpClient,
    private httpUtilService: HttpUtilService
  ) {
    this._isLoggedIn.next(this.hasToken());
    this._currentUserData.next(this.getUserData());
  }

  private getApiConfig() {
    return {
      headers: this.httpUtilService.createHeaders(),
    };
  }

  private getApiConfigForFormData() {
    return {
      headers: this.httpUtilService.createHeaders(false),
    };
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('jwt_token');
  }

  login(loginDTO: LoginDTO): Observable<any> {    
    return this.http.post(this.apiLogin, loginDTO, this.getApiConfig()).pipe(
      tap(response => this.saveUserData(response)), 
      catchError(error => {
        this.clearUserData(); 
        throw error;
      })
    );
  }  
  
  register(registerDTO: RegisterDTO): Observable<any> {
    console.log('Attempting to register user:', registerDTO.email);
    return this.http.post(this.apiRegister, registerDTO, {
        headers: {
            'Content-Type': 'application/json',
            'Accept-Language': 'vi'
        }
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>(this.apiLogout, {}, this.getApiConfig()).pipe(
      tap(() => this.clearUserData()), 
      catchError(error => {
        console.error('Logout API failed, but clearing local data:', error);
        this.clearUserData(); 
        return of(null as any); 
      })
    );
  }

  getListUsers(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/users`);
  }

  createUser(userDTO: UserDTO): Observable<any> {
    return this.http.post(this.apiCreateUser, userDTO, this.getApiConfig());
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${environment.apiBaseUrl}/users/${id}`);
  }

  updateUser(id: number, userDTO: UserDTO): Observable<any> {
    console.log(`Sending JSON update for user ${id} with data:`, userDTO);
    return this.http.put(`${this.apiUpdateUserEndpoint}/${id}`, userDTO, this.getApiConfig());
  }

  updateUserInfo(userId: number, userData: UpdateUserDTO): Observable<any> {
    const formData = new FormData();
    if (userData.name !== undefined && userData.name !== null) formData.append('name', userData.name);
    if (userData.email !== undefined && userData.email !== null) formData.append('email', userData.email);
    if (userData.password) formData.append('password', userData.password); 
    if (userData.description !== undefined && userData.description !== null) formData.append('description', userData.description);
    if (userData.avatar) formData.append('avatar', userData.avatar);
    
    console.log(`Sending update for user ${userId} via FormData (updateUserInfo)`);
    return this.http.put(`${this.apiUpdateUserEndpoint}/${userId}`, formData, this.getApiConfigForFormData());
  }
  
  getCurrentUser(): Observable<any> {
    const token = localStorage.getItem('jwt_token');
    const userData = this.getUserData(); 
    
    if (!token) {
      this.clearUserData(); 
      throw new Error('No JWT token found');
    }
    
    if (!userData || !userData.id || userData.id <= 0) { 
      this.clearUserData(); 
      throw new Error('No user data or user ID found in localStorage');
    }
    
    return this.getCurrentUserById(userData.id);
  }
  
  debugJWTStructure(): void {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.log('❌ No JWT token found for debugging');
      return;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const extractedId = this.extractUserIdFromJWT(payload);
      console.log('🔢 Extracted User ID:', extractedId);
      console.log('Google JWT payload (potential fields):', {
          name: payload?.name,
          email: payload?.email,
          picture: payload?.picture
      });
      
    } catch (error) {
      console.error('❌ Error parsing JWT for debug:', error);
    }
  }
  
  private extractUserIdFromJWT(payload: any): number | null {
    const possibleIds = [
      payload?.checkscam?.principal?.id, 
      payload?.CheckScam?.principal?.id, 
      payload?.id,
      payload?.userId,
      payload?.user_id,
      (typeof payload?.sub === 'string' && !isNaN(parseInt(payload.sub))) ? parseInt(payload.sub) : null 
    ];
    
    console.log('🔍 Trying to extract user ID from JWT payload:', payload);
    console.log('🔍 Possible IDs found:', possibleIds);
    
    for (const id of possibleIds) {
      if (id !== null && !isNaN(id) && id > 0) { 
        console.log('✅ Found valid user ID:', id);
        return parseInt(id.toString());
      }
    }
    
    console.log('❌ No valid user ID found in JWT payload');
    return null;
  }
  
  getCurrentUserById(userId: number): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/users/${userId}`, this.getApiConfig());
  }

  getUserProfile(userId: number): Observable<UserProfileDTO> {
    return this.http.get<UserProfileDTO>(`${this.apiGetProfile}/${userId}/user-profiles`, this.getApiConfig());
  }

  createProfile(userId: number, profileData: UpdateProfileDTO): Observable<ProfileResponseDTO> {
    return this.http.post<ProfileResponseDTO>(`${this.apiCreateProfile}/${userId}/profiles`, profileData, this.getApiConfig());
  }

  updateProfile(profileId: number, profileData: UpdateProfileDTO): Observable<ProfileResponseDTO> {
    return this.http.put<ProfileResponseDTO>(`${this.apiUpdateProfile}/${profileId}`, profileData, this.getApiConfig());
  }

  deleteProfile(profileId: number): Observable<any> {
    return this.http.delete(`${this.apiDeleteProfile}/${profileId}`, this.getApiConfig());
  }

  googleLogin(tokenId: string): Observable<any> {
    console.log('Attempting Google login with ID Token:', tokenId);
    return this.http.post(this.apiGoogleLogin, { tokenId: tokenId }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'vi'
      }
    }).pipe(
      tap(response => this.saveUserData(response)), 
      catchError(error => {
        this.clearUserData(); 
        throw error;
      })
    );
  }

  saveUserData(response: any): void {
    try {
      const rawToken = typeof response === 'string' ? response : response?.token || response?.access_token;
      
      if (!rawToken || typeof rawToken !== 'string') {
        console.warn("Không nhận được token hợp lệ để lưu. Xóa dữ liệu.");
        this.clearUserData();
        return;
      }

      localStorage.setItem('jwt_token', rawToken);

      let payload: any = {};
      try {
        if (rawToken.split('.').length === 3) {
            payload = JSON.parse(atob(rawToken.split('.')[1]));
        } else {
            console.warn("Raw token không phải định dạng JWT. Không thể phân tích payload.");
        }
      } catch (e) {
        console.error("Lỗi khi phân tích JWT payload:", e); 
      }
      
      let roles = response?.roles || payload?.roles || payload?.authorities || []; 
      if (Array.isArray(roles)) {
        roles = roles.map(role => {
          if (typeof role === 'object' && role.role) {
            return role.role;
          }
          if (typeof role === 'object' && role.name) {
            return role.name;
          }
          return role;
        }).filter(Boolean);
      } else {
          roles = [];
      }

      const userId = response?.user?.id || response?.id || this.extractUserIdFromJWT(payload); 
      
      const userName = response?.user?.name || response?.name || payload?.name || payload?.checkscam?.principal?.username || payload?.CheckScam?.principal?.username || payload?.username || payload?.sub;
      const userEmail = response?.user?.email || response?.email || payload?.email || payload?.sub; 
      const userAvatar = response?.user?.avatar || response?.avatar || response?.picture || payload?.picture || payload?.checkscam?.principal?.avatar || payload?.CheckScam?.principal?.avatar; 

      const userData = {
        id: userId || 0,
        name: userName,
        email: userEmail,
        role: roles,
        avatar: userAvatar, 
        description: undefined 
      };

      localStorage.setItem('user', JSON.stringify(userData));
      this._isLoggedIn.next(true); 
      this._currentUserData.next(userData); 
      console.log('UserData saved and BehaviorSubjects updated:', userData);
    } catch (error) {
      console.error("❌ Lỗi toàn bộ quá trình phân tích token và lưu dữ liệu người dùng:", error);
      this.clearUserData();
    }
  }

  getUserData(): any { 
    const userData = localStorage.getItem('user');
    const parsedData = userData ? JSON.parse(userData) : null;
    console.log('User data read from localStorage:', parsedData); 
    return parsedData;
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  clearUserData(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('jwt_token');
    this._isLoggedIn.next(false);
    this._currentUserData.next(null); 
    console.log('User data and token cleared from localStorage. BehaviorSubjects updated.');
  }

  updateUserInLocalStorage(userData: { name?: string; avatar?: string; description?: string; email?: string }): void {
    const existingUserData = this.getUserData();
    if (existingUserData) {
      const updatedData = { ...existingUserData, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedData));
      this._isLoggedIn.next(true); 
      this._currentUserData.next(updatedData); 
      console.log('User data in localStorage updated via updateUserInLocalStorage:', updatedData);
    }
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiForgotPassword}`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiResetPassword}`, { token, newPassword });
  }
}