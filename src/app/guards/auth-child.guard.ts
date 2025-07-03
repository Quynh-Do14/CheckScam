import { Injectable } from '@angular/core';
import { CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthChildGuard implements CanActivateChild {
  
  constructor(
    private tokenService: TokenService,
    private router: Router
  ) {}

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
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

    // Kiểm tra quyền truy cập cho child route cụ thể
    if (childRoute.data['roles']) {
      const requiredRoles = childRoute.data['roles'] as string[];
      
      const hasRequiredRole = requiredRoles.some(role => 
        userRoles.includes(role)
      );
      
      if (!hasRequiredRole) {
        // Nếu không có quyền, chuyển về trang chủ
        this.router.navigate(['/']);
        return false;
      }
    }

    return true;
  }
} 