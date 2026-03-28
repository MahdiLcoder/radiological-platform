import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../services/authService';


@Component({
  selector: 'app-admin-invite',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './admin-invite.html',
  styleUrl: './admin-invite.css',
})
export class AdminInvite {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Modal States
  isSuccessModalOpen = signal(false);
  isErrorModalOpen = signal(false);
  errorMessage = signal('');
  generatedPassword = signal('');

  inviteForm: FormGroup;

  constructor() {
    this.inviteForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      department: [''],
      specialty: [''],
      medical_license_number: [''],
      years_of_experience: [null as number | null],
      clinic: ['']
    });

    // Dynamic role-based validation
    this.inviteForm.get('role')?.valueChanges.subscribe(role => {
      this.updateValidators(role);
    });
  }

  private updateValidators(role: string) {
    const specialty = this.inviteForm.get('specialty');
    const license = this.inviteForm.get('medical_license_number');
    const clinic = this.inviteForm.get('clinic');
    const experience = this.inviteForm.get('years_of_experience');
    const department = this.inviteForm.get('department');

    [specialty, license, clinic, experience, department].forEach(c => c?.clearValidators());

    if (role === 'doctor') {
      specialty?.setValidators([Validators.required]);
      license?.setValidators([Validators.required]);
      clinic?.setValidators([Validators.required]);
    } else if (role === 'radiologist') {
      license?.setValidators([Validators.required]);
      experience?.setValidators([Validators.required, Validators.min(0)]);
    } else if (role === 'admin') {
      department?.setValidators([Validators.required]);
    }

    [specialty, license, clinic, experience, department].forEach(c => c?.updateValueAndValidity());
  }

  private generatePassword(length = 12): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  }

  inviteMutation = injectMutation(() => ({
    mutationFn: (data: any) => {
      const password = this.generatePassword();
      this.generatedPassword.set(password);
      
      const cleanedData = Object.entries(data).reduce((acc: any, [key, value]) => {
        if (value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const payload = {
        ...cleanedData,
        password: password
      };
      return lastValueFrom(this.authService.register(payload));
    },

    onSuccess: () => {
      this.isSuccessModalOpen.set(true);
    },
    onError: (error: any) => {
      const detail = error.error?.detail || error.error?.message || 'An unexpected error occurred';
      this.errorMessage.set(typeof detail === 'string' ? detail : JSON.stringify(detail));
      this.isErrorModalOpen.set(true);
    }
  }));

  sendInvitation() {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    this.inviteMutation.mutate(this.inviteForm.value);
  }

  closeSuccessModal() {
    this.isSuccessModalOpen.set(false);
    this.router.navigate(['/dashboard/admin/users']);
  }

  closeErrorModal() {
    this.isErrorModalOpen.set(false);
  }

  cancel() {
    this.router.navigate(['/dashboard/admin/users']);
  }
}


