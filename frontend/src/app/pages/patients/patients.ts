import { Component, inject } from '@angular/core';
import { PatientService, Patient } from '../../services/patientService';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
})
export class Patients {
  private patientService = inject(PatientService);

  patientsQuery = injectQuery(() => ({
    queryKey: ['patients'],
    queryFn: () => lastValueFrom(this.patientService.getAll()).then(data => {
      console.log('Received patients:', data);
      return Array.isArray(data) ? data : [];
    }),
  }));

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
