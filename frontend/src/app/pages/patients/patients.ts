import { Component, OnInit, signal } from '@angular/core';
import { PatientService, Patient } from '../../services/patientService';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
})
export class Patients implements OnInit {
  patients = signal<Patient[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    this.fetchPatients();
  }

  fetchPatients(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.patientService.getAll().pipe(
      finalize(() => {
        this.loading.set(false);
      })
    ).subscribe({
      next: (data) => {
        console.log('Received patients:', data);
        if (Array.isArray(data)) {
          this.patients.set(data);
        } else {
          console.error('Data is not an array:', data);
          this.patients.set([]);
        }
      },
      error: (err) => {
        console.error('Error fetching patients:', err);
        this.error.set('Failed to load patients. Please check your connection or try again later.');
      }
    });
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
