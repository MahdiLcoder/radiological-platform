import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/internal/operators/tap';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl: string = 'http://localhost:8000/api/auth';

  constructor(private http: HttpClient) { }

  register(username: string, password: string) {
    return this.http.post(`${this.apiUrl}/register/`, {
      username,
      password
    });
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
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post(`${this.apiUrl}/refresh/`, {
      refreshToken
    }).pipe(tap((res: any) => {
      localStorage.setItem('access_token', res.token);
     }))
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  }
}
