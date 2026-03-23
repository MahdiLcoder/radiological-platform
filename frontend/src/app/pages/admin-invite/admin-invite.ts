import { Component, inject } from '@angular/core';
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

  inviteData = {
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    department: '',
    medical_license_number: '',
    years_of_experience: null as number | null,
    clinic: ''
  };


  inviteMutation = injectMutation(() => ({
    mutationFn: (data: any) => {
      // Mapping fields for registration if specific invite doesn't exist
      const payload = {
        username: data.email,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        password: 'TemporaryPassword123!' // Placeholder
      };
      return lastValueFrom(this.authService.register(payload.username, payload.password));
    },
    onSuccess: () => {
      alert('Invitation sent successfully!');
      this.router.navigate(['/dashboard/admin']);
    },
    onError: (error: any) => {
      alert('Error sending invitation: ' + (error.error?.detail || error.message));
    }
  }));

  sendInvitation() {
    if (!this.inviteData.email || !this.inviteData.role) {
      alert('Please fill in at least the email and role.');
      return;
    }
    this.inviteMutation.mutate(this.inviteData);
  }

  cancel() {
    this.router.navigate(['/dashboard/admin']);
  }
}
