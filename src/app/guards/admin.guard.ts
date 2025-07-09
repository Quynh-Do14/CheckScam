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
      // Người dùng chưa đăng nhập, chuyển hướng đến trang đăng nhập
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

    const userRoles = (decodedToken.checkscam?.principal?.authorities || [])
      .map((r: any) => r.role || r);
    const hasAdminRole = userRoles.includes('ADMIN');

    if (!hasAdminRole) {
      this.router.navigate(['/access-denied']);
      return false;
    }

    return true;
  }
}