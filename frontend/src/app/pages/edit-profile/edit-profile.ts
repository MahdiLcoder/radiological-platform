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
    this.updateProfileMutation.mutate({ id, data: formData });
  }
}
