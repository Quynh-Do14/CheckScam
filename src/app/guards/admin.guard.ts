import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = this.tokenService.getToken();
    
    if (!token) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Kiểm tra token có hợp lệ không
    const decodedToken = this.tokenService.getDecodedToken();
    if (!decodedToken) {
      this.tokenService.clearToken();
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Kiểm tra token có hết hạn không
    const currentTime = Date.now() / 1000;
    if (decodedToken.exp && decodedToken.exp < currentTime) {
      this.tokenService.clearToken();
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Lấy role dạng string từ authorities (object hoặc string)
    const userRoles = (decodedToken.checkscam?.principal?.authorities || [])
      .map((r: any) => r.role || r);
    const hasAdminRole = userRoles.includes('ADMIN');
    
    if (!hasAdminRole) {
      // Nếu không có quyền admin, chuyển về trang chủ
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
} 