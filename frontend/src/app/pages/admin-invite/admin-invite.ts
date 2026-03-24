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

  inviteData = {
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    department: '',
    specialty: '',
    medical_license_number: '',
    years_of_experience: null as number | null,
    clinic: ''
  };


  inviteMutation = injectMutation(() => ({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        username: data.email,
        password: 'TemporaryPassword123!' // Placeholder as per design
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
    if (!this.inviteData.email || !this.inviteData.role) {
      this.errorMessage.set('Please fill in at least the email and role.');
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

