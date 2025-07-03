import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = this.tokenService.getToken();
    
    // Kiểm tra token có tồn tại không
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

    // Kiểm tra quyền truy cập nếu route yêu cầu role cụ thể
    if (route.data['roles']) {
      const requiredRoles = route.data['roles'] as string[];
      
      const hasRequiredRole = requiredRoles.some(role => 
        userRoles.includes(role)
      );
      
      if (!hasRequiredRole) {
        this.router.navigate(['/']);
        return false;
      }
    }

    return true;
  }
} 