import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/authService';

const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    const exp = payload?.exp;
    if (!exp) return true;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return exp <= nowInSeconds;
  } catch {
    return true;
  }
};

const redirectIfAuthenticated = (): true | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getAccessToken();
  if (token && !isTokenExpired(token)) {
    return router.parseUrl('/dashboard');
  }
  return true;
};

export const loginRedirectGuard: CanMatchFn = () => redirectIfAuthenticated();
export const loginRedirectActivateGuard: CanActivateFn = () => redirectIfAuthenticated();
