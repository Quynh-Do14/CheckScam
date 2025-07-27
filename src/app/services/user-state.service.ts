import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../environments/environment';

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
    this.setupStorageListener();
  }

  // NEW: Listen for localStorage changes
  private setupStorageListener() {
    // Listen for storage events (when localStorage changes in other tabs)
    window.addEventListener('storage', (event) => {
      if (event.key === 'user' || event.key === 'jwt_token') {
        console.log('Storage changed, reloading user state...');
        this.loadUserFromStorage();
      }
    });

    // Also setup a periodic check for same-tab changes
    setInterval(() => {
      this.checkAndUpdateUserState();
    }, 2000); // Check every 2 seconds
  }

  // NEW: Check if user state needs updating
  private checkAndUpdateUserState() {
    const currentUser = this.userSubject.value;
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('jwt_token');
    
    // If no token but we have a user, clear it
    if (!token && currentUser) {
      console.log('UserStateService: No token found, clearing user state');
      this.userSubject.next(null);
      return;
    }
    
    // If we have token but no user, load from storage
    if (token && !currentUser) {
      console.log('UserStateService: Token found but no user, loading from storage');
      this.loadUserFromStorage();
      return;
    }
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
      avatar: user.avatar.replace(`${environment.apiUrl}/`, ''), // Save relative path
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
    
    return `${environment.apiUrl}/${cleanPath}`;
  }

  getCurrentUser(): UserState | null {
    return this.userSubject.value;
  }

  clearUser() {
    console.log('UserStateService: Clearing user state');
    this.userSubject.next(null);
  }

  // NEW: Force refresh user state (can be called from other services)
  refreshUserState() {
    console.log('UserStateService: Force refreshing user state...');
    this.loadUserFromStorage();
  }

  // NEW: Check if user is logged in
  isUserLoggedIn(): boolean {
    const user = this.userSubject.value;
    const token = localStorage.getItem('jwt_token');
    return !!(user && token);
  }
}
