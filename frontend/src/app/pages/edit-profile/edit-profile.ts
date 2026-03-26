import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/authService';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { LoadingStateComponent } from '../../components/loading-state/loading-state';
import { ErrorStateComponent } from '../../components/error-state/error-state';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoadingStateComponent, ErrorStateComponent],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfile {
  private authService = inject(AuthService);
  private queryClient = inject(QueryClient);

  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  
  passwordError = '';

  toggleOldPassword() { this.showOldPassword = !this.showOldPassword; }
  toggleNewPassword() { this.showNewPassword = !this.showNewPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  profileQuery = injectQuery(() => ({
    queryKey: ['profile'],
    queryFn: () => lastValueFrom(this.authService.getProfile()),
  }));

  updateProfileMutation = injectMutation(() => ({
    mutationFn: ({ id, data }: { id: number | string; data: any }) => 
      lastValueFrom(this.authService.updateProfile(id, data)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  }));

  constructor() {}

  saveChanges(id: number | string, formData: any) {
    this.passwordError = '';
    const payload = { ...formData };
    
    // We only send password fields if user is trying to update it
    if (this.newPassword || this.oldPassword || this.confirmPassword) {
      if (this.newPassword !== this.confirmPassword) {
        this.passwordError = 'New password and confirm password do not match.';
        return; // Halt if they don't match
      }
      if (!this.oldPassword) {
        this.passwordError = 'Old password is required.';
        return;
      }
      payload.old_password = this.oldPassword;
      payload.new_password = this.newPassword;
    }
    
    // Cleanup any password prop mistakenly bound to payload directly
    if (payload.password || payload.password === '') {
      delete payload.password;
    }

    this.updateProfileMutation.mutate({ id, data: payload }, {
      onError: (error: any) => {
        if (error.error && error.error.detail) {
          this.passwordError = error.error.detail;
        } else {
          this.passwordError = 'Failed to update profile or password.';
        }
      },
      onSuccess: () => {
        // Clear passwords on success
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      }
    });
  }
}
