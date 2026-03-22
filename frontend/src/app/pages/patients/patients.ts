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

  patientsQuery = injectQuery(() => ({
    queryKey: ['patients'],
    queryFn: () => lastValueFrom(this.patientService.getAll()).then(data => {
      console.log('Received patients:', data);
      return Array.isArray(data) ? data : [];
    }),
  }));

  filteredPatients = computed<Patient[]>(() => {
    let patients = this.patientsQuery.data() || [];
    
    if (this.activeTab() === 'RECENT') {
      patients = [...patients].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (this.activeTab() === 'PRIORITY') {
      patients = patients.filter(p => (p.stats?.active_diagnoses || 0) > 0);
    }

    const q = this.searchQuery().toLowerCase();
    if (q) {
      patients = patients.filter(p => 
        p.first_name?.toLowerCase().includes(q) ||
        p.last_name?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q)
      );
    }
    
    return patients;
  });

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
