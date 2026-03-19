import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/authService';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const accessToken = localStorage.getItem('access_token');
  const isRefreshRequest = req.url.includes('/api/auth/refresh/');

  if (isRefreshRequest) {
    return next(req);
  }

  const authReq = accessToken ? req.clone({
    headers: req.headers.set('Authorization', `Bearer ${accessToken}`)
  }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return auth.refresh().pipe(
          switchMap((res: any) => {
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${res.access}` 
              }
            });
            return next(retryReq);
          }),
          catchError(() => {
            auth.logout();
            router.navigate(['/login']);
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};