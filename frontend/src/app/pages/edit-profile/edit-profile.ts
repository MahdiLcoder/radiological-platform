import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/authService';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingStateComponent } from '../../components/loading-state/loading-state';
import { ErrorStateComponent } from '../../components/error-state/error-state';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
})
export class EditProfile {
  private authService = inject(AuthService);
  private queryClient = inject(QueryClient);
  private fb = inject(FormBuilder);

  profileForm: FormGroup;

  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  passwordError = '';
  successMessage = '';

  profileQuery = injectQuery(() => ({
    queryKey: ['profile'],
    queryFn: () => lastValueFrom(this.authService.getProfile()),
  }));

  updateProfileMutation = injectMutation(() => ({
    mutationFn: ({ id, data }: { id: number | string; data: any }) =>
      lastValueFrom(this.authService.updateProfile(id, data)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  }));

  constructor() {
    this.profileForm = this.fb.group(
      {
        first_name: ['', [Validators.required]],
        last_name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required]],
        role: [{ value: '', disabled: true }],
        username: [{ value: '', disabled: true }],
        id: [{ value: '', disabled: true }],
        // Role-specific fields
        specialty: [''],
        medical_license_number: [''],
        clinic: [''],
        years_of_experience: [null],
        department: [''],
        // Password section
        oldPassword: [''],
        newPassword: ['', [Validators.minLength(8)]],
        confirmPassword: [''],
      },
      { validators: this.passwordMatchValidator },
    );

    // Sync form with query data
    effect(() => {
      const profile = this.profileQuery.data();
      if (profile) {
        this.profileForm.patchValue(profile);
        this.updateRoleValidators(profile.role);
      }
    });
  }

  private updateRoleValidators(role: string) {
    const specialty = this.profileForm.get('specialty');
    const license = this.profileForm.get('medical_license_number');
    const clinic = this.profileForm.get('clinic');
    const experience = this.profileForm.get('years_of_experience');
    const department = this.profileForm.get('department');

    [specialty, license, clinic, experience, department].forEach((c) => c?.clearValidators());

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

    [specialty, license, clinic, experience, department].forEach((c) =>
      c?.updateValueAndValidity(),
    );
  }

  private passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    const oldPassword = group.get('oldPassword')?.value;

    if (newPassword || oldPassword || confirmPassword) {
      if (!oldPassword) return { oldPasswordRequired: true };
      if (!newPassword) return { newPasswordRequired: true };
      if (newPassword !== confirmPassword) return { passwordMismatch: true };
    }
    return null;
  }

  toggleOldPassword() {
    this.showOldPassword = !this.showOldPassword;
    this.clearMessages();
  }
  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
    this.clearMessages();
  }
  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
    this.clearMessages();
  }

  clearMessages() {
    this.passwordError = '';
    this.successMessage = '';
  }

  saveChanges(id: number | string) {
    this.clearMessages();

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      const errors = this.profileForm.errors;
      if (errors?.['passwordMismatch'])
        this.passwordError = 'Credential confirmation sequence mismatch.';
      else if (errors?.['oldPasswordRequired'])
        this.passwordError = 'Current master key is required to authorize rotation.';
      else if (errors?.['newPasswordRequired'])
        this.passwordError = 'New security sequence must be defined.';
      return;
    }

    const value = this.profileForm.getRawValue();
    const payload = { ...value };

    if (value.newPassword) {
      payload.old_password = value.oldPassword;
      payload.new_password = value.newPassword;
    }

    delete payload.oldPassword;
    delete payload.newPassword;
    delete payload.confirmPassword;

    this.updateProfileMutation.mutate(
      { id, data: payload },
      {
        onError: (error: any) => {
          this.passwordError =
            error.error?.detail || 'Failed to synchronize profile with central registry.';
        },
        onSuccess: () => {
          this.successMessage = 'Profile credentials successfully synchronized.';
          this.profileForm.patchValue({ oldPassword: '', newPassword: '', confirmPassword: '' });
          setTimeout(() => (this.successMessage = ''), 5000);
        },
      },
    );
  }
}
