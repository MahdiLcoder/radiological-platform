import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../services/authService';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  private authService = inject(AuthService);

  // Stats Query
  statsQuery = injectQuery(() => ({
    queryKey: ['admin_stats'],
    queryFn: () => lastValueFrom(this.authService.getStats()),
  }));
}


