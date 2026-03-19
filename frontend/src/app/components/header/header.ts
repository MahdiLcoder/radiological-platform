import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/authService';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private authService = inject(AuthService);
  private router = inject(Router);

  isMenuOpen = signal(false);

  profileQuery = injectQuery(() => ({
    queryKey: ['profile'],
    queryFn: () => lastValueFrom(this.authService.getProfile()) as Promise<UserProfile>,
    enabled: this.authService.isLoggedIn(),
    retry: false,
  }));

  toggleMenu() {
    this.isMenuOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
