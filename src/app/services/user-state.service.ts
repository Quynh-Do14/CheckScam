import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserState {
  id: number;
  name: string;
  email: string;
  avatar: string;
  description?: string;
  role: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private userSubject = new BehaviorSubject<UserState | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  loadUserFromStorage() {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('jwt_token');
    
    if (userData && token) {
      try {
        const user = JSON.parse(userData);
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        
        // Xử lý roles
        let roles = user.role || tokenData?.roles || tokenData?.authorities || [];
        if (Array.isArray(roles)) {
          roles = roles.map(role => {
            if (typeof role === 'object' && role.role) {
              return role.role;
            }
            if (typeof role === 'object' && role.name) {
              return role.name;
            }
            return role;
          });
        }
        
        const userState: UserState = {
          id: user.id || 0,
          name: user.name || tokenData.CheckScam?.principal?.username || '',
          email: user.email || tokenData.sub || '',
          avatar: this.getAvatarUrl(user.avatar),
          description: user.description || '',
          role: roles
        };
        
        this.userSubject.next(userState);
      } catch (error) {
        console.error('Error loading user from storage:', error);
      }
    }
  }

  updateUser(userData: Partial<UserState>) {
    const currentUser = this.userSubject.value;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      updatedUser.avatar = this.getAvatarUrl(userData.avatar || currentUser.avatar);
      
      this.userSubject.next(updatedUser);
      this.saveToStorage(updatedUser);
    }
  }

  private saveToStorage(user: UserState) {
    const existingData = localStorage.getItem('user');
    let userLocalData = existingData ? JSON.parse(existingData) : {};
    
    userLocalData = {
      ...userLocalData,
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar.replace('http://localhost:8080/', ''), // Save relative path
      description: user.description
    };
    
    localStorage.setItem('user', JSON.stringify(userLocalData));
  }

  private getAvatarUrl(avatarPath: string): string {
    if (!avatarPath) {
      return '/assets/img/undraw_profile.svg';
    }
    
    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }
    
    // Fix double slash issue
    const cleanPath = avatarPath.startsWith('/') ? 
      avatarPath.substring(1) : avatarPath;
    
    return `http://localhost:8080/${cleanPath}`;
  }

  getCurrentUser(): UserState | null {
    return this.userSubject.value;
  }

  clearUser() {
    this.userSubject.next(null);
  }
}
