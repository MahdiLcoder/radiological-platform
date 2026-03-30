import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl: string = 'http://localhost:8000/api/auth';
  private http = inject(HttpClient);

  register(userData: any) {
    return this.http.post(`${this.apiUrl}/register/`, userData);
  }

  login(username: string, password: string) {
    return this.http
      .post(`${this.apiUrl}/login/`, {
        username,
        password,
      })
      .pipe(
        tap((res: any) => {
          localStorage.setItem('access_token', res.access);
          localStorage.setItem('refresh_token', res.refresh);
        }),
      );
  }

  refresh() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http
      .post(`${this.apiUrl}/refresh/`, {
        refresh: refreshToken,
      })
      .pipe(
        tap((res: any) => {
          localStorage.setItem('access_token', res.access);
        }),
      );
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me/`);
  }

  updateProfile(id: number | string, profileData: any) {
    return this.http.patch(`${this.apiUrl}/users/${id}/`, profileData);
  }

  uploadProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/me/upload-image/`, formData);
  }

  getUsers(
    role?: string,
    page: number = 1,
    page_size: number = 10,
    search?: string,
  ): Observable<any> {
    const params: any = { page, page_size };
    if (role) params.role = role;
    if (search) params.search = search;
    return this.http.get<any>(`${this.apiUrl}/users/`, { params });
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats/`);
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.apiUrl}/forgot-password/`, { email });
  }

  deleteUser(id: number | string) {
    return this.http.delete(`${this.apiUrl}/users/${id}/`);
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  isLoggedIn() {
    return !!this.getAccessToken();
  }

  getCurrentUserId(): number | null {
    const token = this.getAccessToken();
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id;
    }
    return null;
  }
}
