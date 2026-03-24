import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl: string = 'http://localhost:8000/api/auth';

  constructor(private http: HttpClient) { }

  register(userData: any) {
    return this.http.post(`${this.apiUrl}/register/`, userData);
  }


  login(username: string, password: string) { 
    return this.http.post(`${this.apiUrl}/login/`, {
      username,
      password
    }).pipe(tap((res: any) => {
      localStorage.setItem('access_token', res.access);
      localStorage.setItem('refresh_token', res.refresh);
     }))
  }

  refresh() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http.post(`${this.apiUrl}/refresh/`, {
      refresh: refreshToken
    }).pipe(tap((res: any) => {
      localStorage.setItem('access_token', res.access);
     }))
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me/`);
  }

  updateProfile(id: number | string, profileData: any) {
    return this.http.patch(`${this.apiUrl}/users/${id}/`, profileData);
  }

  getUsers(role?: string, page: number = 1, page_size: number = 10): Observable<any> {
    const params: any = { page, page_size };
    if (role) params.role = role;
    return this.http.get<any>(`${this.apiUrl}/users/`, { params });
  }



  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats/`);
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
}
