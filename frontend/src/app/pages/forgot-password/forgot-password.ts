import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/authService';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  forgotForm: FormGroup;
  sent = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  resetMutation = injectMutation(() => ({
    mutationFn: (email: string) =>
      lastValueFrom(this.authService.forgotPassword(email)),
    onSuccess: () => {
      this.sent.set(true);
      this.errorMessage.set(null);
    },
    onError: (err: any) => {
      const detail = err?.error?.detail;
      if (typeof detail === 'object') {
        const first = Object.values(detail)[0];
        this.errorMessage.set(Array.isArray(first) ? first[0] : String(first));
      } else {
        this.errorMessage.set(detail ?? 'Something went wrong. Please try again later.');
      }
    },
  }));

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }
    this.resetMutation.mutate(this.forgotForm.value.email);
  }
}
