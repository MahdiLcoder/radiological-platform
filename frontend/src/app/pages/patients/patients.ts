import { Component, inject, computed, signal } from '@angular/core';
import { PatientService, Patient } from '../../services/patientService';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { WelcomeSection } from '../../components/welcome-section/welcome-section';
import { WorklistTable, WorklistItem } from '../../components/worklist-table/worklist-table';
import { FiltersSection, TabConfig } from '../../components/filters-section/filters-section';
import { LoadingStateComponent } from '../../components/loading-state/loading-state';
import { ErrorStateComponent } from '../../components/error-state/error-state';
import { EmptyStateComponent } from '../../components/empty-state/empty-state';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WelcomeSection,
    WorklistTable,
    FiltersSection,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
})
export class Patients {
  private patientService = inject(PatientService);

  tableColumns: string[] = [
    'Patient Identity',
    'Registry Reference',
    'Clinical Demographics',
    'Creation Date',
    'Actions',
  ];

  filterTabs: TabConfig[] = [
    { key: 'ALL', label: 'All', icon: 'clinical_notes' },
    { key: 'RECENT', label: 'Recent', icon: 'history' },
    { key: 'PRIORITY', label: 'Critical', icon: 'emergency' },
  ];

  searchQuery = signal('');
  activeTab = signal<'ALL' | 'RECENT' | 'PRIORITY'>('ALL');
  currentPage = signal(1);

  patientsQuery = injectQuery(() => ({
    queryKey: ['patients', this.searchQuery(), this.activeTab(), this.currentPage()],
    queryFn: () =>
      lastValueFrom(
        this.patientService.getAll({
          search: this.searchQuery(),
          tab: this.activeTab(),
          page: this.currentPage(),
          page_size: 10,
        }),
      ),
  }));

  worklistData = computed<WorklistItem[]>(() => {
    const data: any = this.patientsQuery.data();
    const results = data?.results || [];

    return results.map((patient: Patient) => {
      const initials = this.getInitials(patient.first_name, patient.last_name);
      const name = `${patient.first_name} ${patient.last_name}`;
      const age = this.calculateAge(patient.date_of_birth);
      const gender = patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other';
      const createdAt = new Date(patient.created_at || Date.now());

      return {
        id: patient.id || 'N/A',
        patient: {
          initials,
          name,
          id: (patient.id || 'N/A').substring(0, 12).toUpperCase(),
          isEmergency: false,
        },
        modality: `REF-${(patient.id?.substring(0, 6) || 'NA').toUpperCase()}`,
        uploadDate: {
          time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: createdAt.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        },
        aiStatus: `${gender} • ${age}Y`,
        action: {
          type: 'view',
          text: 'Browse Scans',
          link: ['/dashboard/patient-detail', patient.id],
        },
      };
    });
  });

  totalPages = computed(() => (this.patientsQuery.data() as any)?.total_pages || 1);
  totalItems = computed(() => (this.patientsQuery.data() as any)?.count || 0);

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
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

  private getInitials(firstName: string, lastName: string): string {
    if (!firstName || !lastName) return 'P';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  private calculateAge(dobString: string | undefined): number | string {
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
