import { Component, OnInit, inject, effect, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PatientService, Patient } from '../../services/patientService';
import { CommonModule } from '@angular/common';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-create-patient',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './create-patient.html',
  styleUrl: './create-patient.css',
})
export class CreatePatient implements OnInit {
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  patientForm!: FormGroup;
  isEditMode = false;
  patientCin: string | null = null;
  title = 'Register New Patient';
  serverError = signal<string | null>(null);
  fieldErrors = signal<Record<string, string>>({});

  patientQuery = injectQuery(() => ({
    queryKey: ['patient', this.patientCin],
    queryFn: () => lastValueFrom(this.patientService.getByCin(this.patientCin!)),
    enabled: !!this.patientCin,
  }));

  patientMutation = injectMutation(() => ({
    mutationFn: (patientData: any) =>
      this.isEditMode
        ? lastValueFrom(this.patientService.update(this.patientCin!, patientData))
        : lastValueFrom(this.patientService.create(patientData)),
    onSuccess: () => {
      this.router.navigate(['/dashboard/patients']);
    },
    onError: (err: any) => {
      const detail = err?.error?.detail;
      if (typeof detail === 'object') {
        this.fieldErrors.set(detail);
        this.serverError.set('Please correct the highlighted fields.');
      } else {
        this.serverError.set(detail || 'Failed to save patient. Please try again.');
      }
    },
  }));

  constructor() {
    effect(() => {
      const patient = this.patientQuery.data() as Patient;
      if (patient) {
        this.patientForm.patchValue({
          first_name: patient.first_name,
          last_name: patient.last_name,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          phone: patient.phone,
          cin: patient.cin,
          email: patient.email
        });
      }
    });
  }

  ngOnInit(): void {
    this.patientCin = this.route.snapshot.paramMap.get('cin');
    if (this.patientCin) {
      this.isEditMode = true;
      this.title = 'Edit Patient Details';
    }

    this.patientForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      date_of_birth: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]{7,20}$/)]],
      cin: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      email: ['', [Validators.email]]
    });
  }

  onSubmit(): void {
    this.serverError.set(null);
    this.fieldErrors.set({});

    if (this.patientForm.valid) {
      this.patientMutation.mutate(this.patientForm.value);
    } else {
      this.patientForm.markAllAsTouched();
    }
  }

  getFieldError(fieldName: string): string | null {
    const control = this.patientForm.get(fieldName);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return this.formatFieldName(fieldName) + ' is required';
      if (control.errors['email']) return 'Enter a valid email address';
      if (control.errors['pattern']) {
        if (fieldName === 'cin') return 'CIN must be exactly 8 digits';
        return 'Enter a valid phone number (e.g. +1 555-000-0000)';
      }
    }
    const serverFieldErrors = this.fieldErrors();
    if (serverFieldErrors[fieldName]) return serverFieldErrors[fieldName];
    return null;
  }

  private formatFieldName(field: string): string {
    return field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
