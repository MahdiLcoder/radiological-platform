import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, of, Observable } from 'rxjs';
import { AuthService } from '../services/authService';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const accessToken = auth.getAccessToken();
  const isAuthRequest = req.url.includes('/api/auth/login/') || 
                        req.url.includes('/api/auth/register/') ||
                        req.url.includes('/api/auth/refresh/');

  if (isAuthRequest) {
    return next(req);
  }

  let authReq = req;
  if (accessToken) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${accessToken}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshing) {
        isRefreshing = true;
        return auth.refresh().pipe(
          switchMap((res: any) => {
            isRefreshing = false;
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${res.access}` 
              }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            auth.logout();
            router.navigate(['/']);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};