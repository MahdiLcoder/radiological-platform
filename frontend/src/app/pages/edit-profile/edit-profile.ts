import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/authService';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
  successMessage = '';

  toggleOldPassword() { this.showOldPassword = !this.showOldPassword; this.clearMessages(); }
  toggleNewPassword() { this.showNewPassword = !this.showNewPassword; this.clearMessages(); }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; this.clearMessages(); }

  clearMessages() {
    this.passwordError = '';
    this.successMessage = '';
  }

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
    this.clearMessages();
    const payload = { ...formData };
    
    // Comprehensive Password Integrity Logic
    if (this.newPassword || this.oldPassword || this.confirmPassword) {
      if (!this.oldPassword) {
        this.passwordError = 'Current master key is required to authorize rotation.';
        return;
      }
      if (!this.newPassword) {
        this.passwordError = 'New security sequence must be defined.';
        return;
      }
      if (this.newPassword.length < 8) {
        this.passwordError = 'Security protocol requires at least 8 characters.';
        return;
      }
      if (this.newPassword !== this.confirmPassword) {
        this.passwordError = 'Credential confirmation sequence mismatch.';
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
          this.passwordError = 'Failed to synchronize profile with central registry.';
        }
      },
      onSuccess: () => {
        this.successMessage = 'Profile credentials successfully synchronized.';
        // Clear sensitive inputs
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => this.successMessage = '', 5000);
      }
    });
  }
}
