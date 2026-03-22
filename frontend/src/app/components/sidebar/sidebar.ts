import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/authService';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private authService = inject(AuthService);

  profileQuery = injectQuery(() => ({
    queryKey: ['profile'],
    queryFn: () => lastValueFrom(this.authService.getProfile()) as Promise<any>,
    enabled: this.authService.isLoggedIn(),
    retry: false,
  }));
}
