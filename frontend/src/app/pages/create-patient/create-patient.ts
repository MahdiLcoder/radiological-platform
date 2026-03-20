import { Component, OnInit, inject, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PatientService, Patient } from '../../services/patientService';
import { CommonModule } from '@angular/common';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
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
  private route = inject(ActivatedRoute);

  patientForm!: FormGroup;
  isEditMode = false;
  patientId: string | null = null;
  title = 'Register New Patient';

  patientQuery = injectQuery(() => ({
    queryKey: ['patient', this.patientId],
    queryFn: () => lastValueFrom(this.patientService.getById(this.patientId!)),
    enabled: !!this.patientId,
  }));

  patientMutation = injectMutation(() => ({
    mutationFn: (patientData: any) => 
      this.isEditMode 
        ? lastValueFrom(this.patientService.update(this.patientId!, patientData))
        : lastValueFrom(this.patientService.create(patientData)),
    onSuccess: () => {
      this.router.navigate(['/dashboard/patients']);
    },
    onError: (err: any) => {
      console.error(`Error ${this.isEditMode ? 'updating' : 'creating'} patient:`, err);
    }
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
          email: patient.email
        });
      }
    });
  }

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id');
    if (this.patientId) {
      this.isEditMode = true;
      this.title = 'Edit Patient Details';
    }

    this.patientForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      date_of_birth: [''],
      gender: [''],
      phone: [''],
      email: ['', [Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.patientForm.valid) {
      this.patientMutation.mutate(this.patientForm.value);
    } else {
      Object.keys(this.patientForm.controls).forEach(key => {
        const control = this.patientForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
