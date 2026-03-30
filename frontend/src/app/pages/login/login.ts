import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/authService';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  showPassword = false;
  loginForm: FormGroup;
  loginError = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  loginMutation = injectMutation(() => ({
    mutationFn: (credentials: { userName: string; password: string }) =>
      lastValueFrom(this.authService.login(credentials.userName, credentials.password)),
    onSuccess: () => {
      this.router.navigate(['/dashboard']);
    },
    onError: (err: any) => {
      const detail = err?.error?.detail;
      if (detail && typeof detail === 'string') {
        this.loginError.set(detail);
      } else {
        this.loginError.set('Invalid username or password. Please try again.');
      }
    },
  }));

  onLogin(): void {
    this.loginError.set(null);
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loginMutation.mutate(this.loginForm.value);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
