import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../services/authService';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers {
  private authService = inject(AuthService);
  private queryClient = inject(QueryClient);
  private router = inject(Router);

  // Modal State
  isEditModalOpen = signal(false);
  isDeleteModalOpen = signal(false);
  isSuccessModalOpen = signal(false);
  
  editingUser = signal<any>(null);
  userToDelete = signal<any>(null);
  successMessage = signal('');

  // Pagination State
  currentPage = signal(1);
  pageSize = signal(10);

  // Queries
  profileQuery = injectQuery(() => ({
    queryKey: ['current_profile'],
    queryFn: () => lastValueFrom(this.authService.getProfile()),
  }));

  usersQuery = injectQuery(() => ({
    queryKey: ['admin_users', this.currentPage()],
    queryFn: () => lastValueFrom(this.authService.getUsers(undefined, undefined, this.currentPage(), this.pageSize())),
  }));


  nextPage() {
    const data = this.usersQuery.data();
    if (data?.next) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }


  // Mutations
  updateUserMutation = injectMutation(() => ({
    mutationFn: (data: { id: number | string; payload: any }) =>
      lastValueFrom(this.authService.updateProfile(data.id, data.payload)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      this.closeEditModal();
      this.showSuccess('User profile has been updated successfully.');
    },
  }));

  deleteUserMutation = injectMutation(() => ({
    mutationFn: (id: number | string) => lastValueFrom(this.authService.deleteUser(id)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      this.closeDeleteModal();
      this.showSuccess('User has been removed from the system.');
    },
  }));

  deleteUser(user: any) {
    this.userToDelete.set(user);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete() {
    const user = this.userToDelete();
    if (user) {
      this.deleteUserMutation.mutate(user.id);
    }
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.userToDelete.set(null);
  }

  showSuccess(message: string) {
    this.successMessage.set(message);
    this.isSuccessModalOpen.set(true);
    setTimeout(() => this.closeSuccessModal(), 3000);
  }

  closeSuccessModal() {
    this.isSuccessModalOpen.set(false);
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
      const { id, first_name, last_name, email, role, department, medical_license_number, years_of_experience, clinic, is_active } = user;
      this.updateUserMutation.mutate({
        id,
        payload: { first_name, last_name, email, role, department, medical_license_number, years_of_experience, clinic, is_active }
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

  goBack() {
    this.router.navigate(['/dashboard/admin']);
  }
}
