import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../services/authService';

@Component({
  selector: 'app-admin-invite',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-invite.html',
  styleUrl: './admin-invite.css',
})
export class AdminInvite {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Modal States
  isSuccessModalOpen = signal(false);
  isErrorModalOpen = signal(false);
  errorMessage = signal('');
  generatedPassword = signal('');

  inviteData = {
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    role: '',
    department: '',
    specialty: '',
    medical_license_number: '',
    years_of_experience: null as number | null,
    clinic: ''
  };

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
      
      // Clean up the payload: remove null or empty string values
      const cleanedData = Object.entries(data).reduce((acc: any, [key, value]) => {
        if (value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const payload = {
        ...cleanedData,
        username: data.username,
        password: password
      };
      return lastValueFrom(this.authService.register(payload));
    },

    onSuccess: () => {
      this.isSuccessModalOpen.set(true);
    },
    onError: (error: any) => {
      this.errorMessage.set(error.error?.detail || error.message || 'An unexpected error occurred');
      this.isErrorModalOpen.set(true);
    }
  }));

  sendInvitation() {
    if (!this.inviteData.email || !this.inviteData.role || !this.inviteData.username) {
      this.errorMessage.set('Please fill in at least the username, email, and role.');
      this.isErrorModalOpen.set(true);
      return;
    }
    this.inviteMutation.mutate(this.inviteData);
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

