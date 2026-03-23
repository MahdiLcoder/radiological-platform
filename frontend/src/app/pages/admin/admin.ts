import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../services/authService';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  private authService = inject(AuthService);
  private queryClient = inject(QueryClient);

  // Modal State
  isEditModalOpen = signal(false);
  editingUser = signal<any>(null);

  // Stats Query
  statsQuery = injectQuery(() => ({
    queryKey: ['admin_stats'],
    queryFn: () => lastValueFrom(this.authService.getStats()),
  }));

  // Users Query
  usersQuery = injectQuery(() => ({
    queryKey: ['admin_users'],
    queryFn: () => lastValueFrom(this.authService.getUsers()),
  }));

  // Mutations
  updateUserMutation = injectMutation(() => ({
    mutationFn: (data: { id: number | string; payload: any }) =>
      lastValueFrom(this.authService.updateProfile(data.id, data.payload)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      this.queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
      this.closeEditModal();
    },
  }));

  deleteUserMutation = injectMutation(() => ({
    mutationFn: (id: number | string) => lastValueFrom(this.authService.deleteUser(id)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      this.queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
    },
  }));

  deleteUser(user: any) {
    if (confirm(`Are you sure you want to delete ${user.first_name || user.username}?`)) {
      this.deleteUserMutation.mutate(user.id);
    }
  }

  openEditModal(user: any) {
    this.editingUser.set({ ...user });
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.editingUser.set(null);
  }

  saveEdit() {
    const user = this.editingUser();
    if (user) {
      const { id, first_name, last_name, email, role } = user;
      this.updateUserMutation.mutate({
        id,
        payload: { first_name, last_name, email, role }
      });
    }
  }

  formatDate(dateStr: string) {

    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getRoleClass(role: string) {
    switch (role) {
      case 'admin': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  }

  getInitials(user: any) {
    const first = user.first_name?.charAt(0) || '';
    const last = user.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U';
  }
}

