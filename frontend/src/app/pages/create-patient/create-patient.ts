import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PatientService } from '../../services/patientService';
import { CommonModule } from '@angular/common';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-create-patient',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './create-patient.html',
  styleUrl: './create-patient.css',
})
export class CreatePatient implements OnInit {
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private router = inject(Router);

  patientForm!: FormGroup;

  createPatientMutation = injectMutation(() => ({
    mutationFn: (patientData: any) => lastValueFrom(this.patientService.create(patientData)),
    onSuccess: () => {
      this.router.navigate(['/dashboard/patients']);
    },
    onError: (err: any) => {
      console.error('Error creating patient:', err);
    }
  }));

  ngOnInit(): void {
    this.patientForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      date_of_birth: [''],
      gender: [''],
      phone: [''],
      email: ['', [Validators.email]],
      // Exta fields from UI (not in backend model yet)
      blood_type: [''],
      address: [''],
      chronic_conditions: [''],
      is_smoker: [false],
      is_diabetic: [false],
      has_hypertension: [false]
    });
  }

  onSubmit(): void {
    if (this.patientForm.valid) {
      // Filter out fields not supported by backend
      const { blood_type, address, chronic_conditions, is_smoker, is_diabetic, has_hypertension, ...patientData } = this.patientForm.value;
      this.createPatientMutation.mutate(patientData);
    } else {
      Object.keys(this.patientForm.controls).forEach(key => {
        const control = this.patientForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
