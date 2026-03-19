import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PatientService } from '../../services/patientService';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-patient',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './create-patient.html',
  styleUrl: './create-patient.css',
})
export class CreatePatient implements OnInit {
  patientForm!: FormGroup;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private router: Router
  ) {}

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
      this.loading = true;
      this.error = null;
      
      // Filter out fields not supported by backend
      const { blood_type, address, chronic_conditions, is_smoker, is_diabetic, has_hypertension, ...patientData } = this.patientForm.value;
      
      this.patientService.create(patientData).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard/patients']);
        },
        error: (err) => {
          console.error('Error creating patient:', err);
          this.error = err.error?.message || 'Failed to register patient. Please check your input.';
          this.loading = false;
        }
      });
    } else {
      Object.keys(this.patientForm.controls).forEach(key => {
        const control = this.patientForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
