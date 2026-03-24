import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/authService';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private authService = inject(AuthService);

  private navItems = [
    { label: 'Dashboard', icon: 'dashboard', link: '/dashboard', roles: ['admin', 'radiologist', 'doctor'], exact: true },
    { label: 'Staff Management', icon: 'badge', link: '/dashboard/admin/users', roles: ['admin'] },
    { label: 'Analytics', icon: 'analytics', link: '/dashboard/analytics', roles: ['admin'] },
    { label: 'Upload Scans', icon: 'upload_file', link: '/dashboard/upload', roles: ['radiologist'] },
    { label: 'All Scans', icon: 'collections', link: '/dashboard/all-images', roles: ['radiologist'] },
    { label: 'Reports', icon: 'clinical_notes', link: '/dashboard/reports', roles: ['admin', 'radiologist', 'doctor'] },
    { label: 'Patient Records', icon: 'groups', link: '/dashboard/patients', roles: ['doctor'] },
  ];

  profileQuery = injectQuery(() => ({
    queryKey: ['profile'],
    queryFn: () => lastValueFrom(this.authService.getProfile()) as Promise<any>,
    enabled: this.authService.isLoggedIn(),
    retry: false,
  }));

  get filteredNavItems() {
    const role = this.profileQuery.data()?.role?.toLowerCase();
    if (!role) return [];
    return this.navItems.filter(item => item.roles.includes(role));
  }

}
