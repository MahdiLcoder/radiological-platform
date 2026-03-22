import { Component, inject, computed, signal } from '@angular/core';
import { PatientService, Patient } from '../../services/patientService';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
})
export class Patients {
  private patientService = inject(PatientService);

  searchQuery = signal('');
  activeTab = signal<'ALL'|'RECENT'|'PRIORITY'>('ALL');
  currentPage = signal(1);

  patientsQuery = injectQuery(() => ({
    queryKey: ['patients', this.searchQuery(), this.activeTab(), this.currentPage()],
    queryFn: () => lastValueFrom(
      this.patientService.getAll({
        search: this.searchQuery(),
        tab: this.activeTab(),
        page: this.currentPage(),
        page_size: 10
      })
    ),
  }));

  filteredPatients = computed<Patient[]>(() => {
    const data: any = this.patientsQuery.data();
    return data?.results || [];
  });

  totalPages = computed(() => (this.patientsQuery.data() as any)?.total_pages || 1);
  totalItems = computed(() => (this.patientsQuery.data() as any)?.count || 0);

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  onFilterChange() {
    this.currentPage.set(1);
  }

  getInitials(firstName: string, lastName: string): string {
    if (!firstName || !lastName) return 'P';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  calculateAge(dobString: string | undefined): number | string {
    if (!dobString) return 'N/A';
    try {
      const dob = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return 'N/A';
    }
  }
}
