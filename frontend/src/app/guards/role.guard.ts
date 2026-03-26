import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  CanMatchFn,
  Router,
  Route,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService } from '../services/authService';

const getAllowedRoles = (routeData?: { [key: string]: any }): string[] =>
  (routeData?.['roles'] as string[] | undefined)?.map((r) => r.toLowerCase()) ?? [];

const checkRole = (allowed: string[]): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If no specific roles are required, allow access.
  if (allowed.length === 0) return of(true);

  return authService.getProfile().pipe(
    map((profile) => {
      const userRole = profile?.role?.toLowerCase();
      if (userRole && allowed.includes(userRole)) {
        return true;
      }
      return router.parseUrl('/dashboard');
    }),
    catchError(() => of(router.parseUrl('/')))
  );
};

export const roleGuard: CanMatchFn = (route: Route, _segments: UrlSegment[]) =>
  checkRole(getAllowedRoles(route.data));

export const roleActivateGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
) => checkRole(getAllowedRoles(route.data));

export const roleActivateChildGuard: CanActivateChildFn = (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
) => checkRole(getAllowedRoles(route.data));
