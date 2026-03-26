import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService } from '../services/authService';

const roleToPath: Record<string, string> = {
  admin: '/dashboard/admin',
  radiologist: '/dashboard/radiologist',
  doctor: '/dashboard/doctor',
};

export const dashboardRedirectGuard: CanMatchFn = (
  _route: Route,
  _segments: UrlSegment[]
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getProfile().pipe(
    map((profile) => {
      const role = profile?.role?.toLowerCase();
      const target = role ? roleToPath[role] : null;
      return target ? router.parseUrl(target) : router.parseUrl('/');
    }),
    catchError(() => of(router.parseUrl('/')))
  );
};
