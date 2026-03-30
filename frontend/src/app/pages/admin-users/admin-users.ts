import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../services/authService';

import { WelcomeSection } from '../../components/welcome-section/welcome-section';
import {
  FiltersSection,
  SelectFilterConfig,
} from '../../components/filters-section/filters-section';
import { LoadingStateComponent } from '../../components/loading-state/loading-state';
import { EmptyStateComponent } from '../../components/empty-state/empty-state';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    WelcomeSection,
    FiltersSection,
    LoadingStateComponent,
    EmptyStateComponent,
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers {
  private authService = inject(AuthService);
  private queryClient = inject(QueryClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  isEditModalOpen = signal(false);
  isDeleteModalOpen = signal(false);
  isSuccessModalOpen = signal(false);

  editingUser = signal<any>(null);
  userToDelete = signal<any>(null);
  successMessage = signal('');
  serverError = signal<string | null>(null);

  editForm: FormGroup;

  currentPage = signal(1);
  pageSize = signal(10);

  searchTerm = signal('');
  selectedRole = signal('');

  filterSelects: SelectFilterConfig[] = [
    {
      key: 'role',
      icon: 'filter_list',
      placeholder: 'All Roles',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Radiologist', value: 'radiologist' },
        { label: 'Doctor', value: 'doctor' },
      ],
    },
  ];

  constructor() {
    this.editForm = this.fb.group({
      id: [''],
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      department: [''],
      medical_license_number: [''],
      specialty: [''],
      clinic: [''],
      years_of_experience: [null],
    });

    this.editForm.get('role')?.valueChanges.subscribe((role: string) => {
      this.updateEditFormValidators(role);
    });
  }

  private updateEditFormValidators(role: string) {
    const specialty = this.editForm.get('specialty');
    const license = this.editForm.get('medical_license_number');
    const clinic = this.editForm.get('clinic');
    const experience = this.editForm.get('years_of_experience');
    const department = this.editForm.get('department');

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

  profileQuery = injectQuery(() => ({
    queryKey: ['current_profile'],
    queryFn: () => lastValueFrom(this.authService.getProfile()),
  }));

  usersQuery = injectQuery(() => ({
    queryKey: ['admin_users', this.currentPage(), this.selectedRole(), this.searchTerm()],
    queryFn: () =>
      lastValueFrom(
        this.authService.getUsers(
          this.selectedRole() || undefined,
          this.currentPage(),
          this.pageSize(),
          this.searchTerm() || undefined,
        ),
      ),
  }));

  filterStats = computed(() => {
    const data: any = this.usersQuery.data();
    if (!data) return '';
    return `Displaying <span class="text-slate-900">${data.results?.length || 0}</span> of <span class="text-slate-900">${data.count || 0}</span> Professionals`;
  });

  nextPage() {
    const data = this.usersQuery.data();
    if (data?.next) {
      this.currentPage.update((p) => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  onFilterChange() {
    this.currentPage.set(1);
  }

  updateUserMutation = injectMutation(() => ({
    mutationFn: (data: { id: number | string; payload: any }) =>
      lastValueFrom(this.authService.updateProfile(data.id, data.payload)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      this.closeEditModal();
      this.showSuccess('User profile has been updated successfully.');
    },
    onError: (err: any) => {
      const detail = err?.error?.detail;
      if (typeof detail === 'object') {
        const msg = Object.entries(detail)
          .map(([key, val]) => key.replace(/_/g, ' ') + ': ' + (Array.isArray(val) ? val[0] : val))
          .join('. ');
        this.serverError.set(msg);
      } else {
        this.serverError.set(detail || 'Failed to update user. Please try again.');
      }
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
    this.serverError.set(null);
    this.editForm.patchValue({
      id: user.id,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      role: user.role || '',
      department: user.department || '',
      medical_license_number: user.medical_license_number || '',
      specialty: user.specialty || user.department || '',
      clinic: user.clinic || '',
      years_of_experience: user.years_of_experience ?? null,
    });
    this.updateEditFormValidators(user.role);
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.editingUser.set(null);
    this.serverError.set(null);
    this.editForm.reset();
  }

  saveEdit() {
    this.serverError.set(null);

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.getRawValue();
    const { id, ...payload } = value;
    this.updateUserMutation.mutate({ id, payload });
  }

  formatDate(dateStr: string) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getRoleClass(role: string) {
    switch (role) {
      case 'admin':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
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
