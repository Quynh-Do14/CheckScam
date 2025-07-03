import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './interceptors/token.interceptor';

import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([tokenInterceptor])
    ),
    provideAnimations(),  // Cần thiết cho các animation của Toastr và các animation Angular khác
    provideToastr({       // Cấu hình Toastr
      timeOut: 3000,      // Thời gian hiển thị toast (3 giây)
      positionClass: 'toast-top-right', // Vị trí hiển thị (góc trên bên phải)
      preventDuplicates: true, // Ngăn chặn hiển thị nhiều toast trùng lặp
    }),
  ]
};