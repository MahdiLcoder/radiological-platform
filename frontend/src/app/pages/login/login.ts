import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authService';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  showPassword = false;
  userName = '';
  password = '';

  loginMutation = injectMutation(() => ({
    mutationFn: (credentials: { userName: string; password: string }) =>
      lastValueFrom(this.authService.login(credentials.userName, credentials.password)),
    onSuccess: () => {
      this.router.navigate(['/dashboard']);
    },
  }));

  onLogin(): void {
    this.loginMutation.mutate({ userName: this.userName, password: this.password });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}