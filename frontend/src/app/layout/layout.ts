import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Header } from '../components/header/header';
import { Sidebar } from '../components/sidebar/sidebar';
import { AuthService } from '../services/authService';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Header, Sidebar],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  async ngOnInit() {
    if (this.router.url === '/dashboard' ) {
      try {
        const profile = await lastValueFrom(this.authService.getProfile());
        const role = profile.role?.toLowerCase();
        
        switch (role) {
          case 'admin':
            this.router.navigate(['/dashboard/admin']);
            break;
          case 'radiologist':
            this.router.navigate(['/dashboard/radiologist']);
            break;
          case 'doctor':
            this.router.navigate(['/dashboard/patients']);
            break;
          default:
            this.router.navigate(['/']);
            break;
        }
      } catch (error) {
        console.error('Failed to fetch profile for redirection', error);
      }
    }
  }
}
