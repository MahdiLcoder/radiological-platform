import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { AuthService } from '../../services/authService';

const roleToPath: Record<string, string> = {
  admin: '/dashboard/admin',
  radiologist: '/dashboard/radiologist',
  doctor: '/dashboard/doctor',
};

@Component({
  selector: 'app-loading-route',
  imports: [CommonModule],
  templateUrl: './loading.html',
  styleUrl: './loading.css',
})
export class LoadingComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.authService
      .getProfile()
      .pipe(take(1))
      .subscribe({
        next: (profile) => {
          const role = profile?.role?.toLowerCase?.();
          const target = role ? roleToPath[role] : '/';
          this.router.navigateByUrl(target);
        },
        error: () => this.router.navigateByUrl('/'),
      });
  }
}
