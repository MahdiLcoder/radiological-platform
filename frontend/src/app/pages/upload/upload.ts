import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom, Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { AnalysisService } from '../../services/analysisService';
import { PatientService, Patient } from '../../services/patientService';
import { Router } from '@angular/router';

import { WelcomeSection } from '../../components/welcome-section/welcome-section';

@Component({
  selector: 'app-upload',
  imports: [ReactiveFormsModule, CommonModule, WelcomeSection],
  templateUrl: './upload.html',
  styleUrl: './upload.css',
})
export class Upload {
  private analysisService = inject(AnalysisService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  uploadForm: FormGroup;
  selectedFiles: File[] = [];
  imagePreviewUrl = signal<string | null>(null);
  
  // Patient Search Logic
  searchQuery = signal('');
  selectedPatient = signal<Patient | null>(null);
  showResults = signal(false);

  patientsQuery = injectQuery(() => ({
    queryKey: ['patients', 'search', this.searchQuery()],
    queryFn: () => lastValueFrom(this.patientService.getAll({ search: this.searchQuery() })),
    enabled: this.searchQuery().length > 1 && !this.selectedPatient(),
    staleTime: 5000,
  }));

  constructor() {
    this.uploadForm = this.fb.group({
      patientCin: ['', [Validators.required]],
      modality: ['X-Ray', [Validators.required]]
    });
  }

  onSearchChange(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    this.searchQuery.set(term);
    this.showResults.set(true);
    
    // If user types, clear existing selection to allow new search results to appear
    if (this.selectedPatient()) {
      this.selectedPatient.set(null);
      this.uploadForm.patchValue({ patientCin: '' });
    }
    
    // If user clears input, ensure form is also cleared
    if (!term) {
      this.uploadForm.patchValue({ patientCin: '' });
    }
  }

  selectPatient(patient: Patient) {
    this.selectedPatient.set(patient);
    this.uploadForm.patchValue({ patientCin: patient.cin });
    this.searchQuery.set(`${patient.first_name} ${patient.last_name} (${patient.cin})`);
    this.showResults.set(false);
  }

  hideResults() {
    // Delay hiding to allow click event on result list
    setTimeout(() => this.showResults.set(false), 200);
  }

  // Unified Analysis Mutation (Upload -> Run Prediction)
  analysisMutation = injectMutation(() => ({
    mutationFn: async (data: { file: File; patientCin: string; modality: string }) => {
      const uploadRes = await lastValueFrom(
        this.analysisService.uploadImage(data.file, data.patientCin, data.modality)
      );
      const predictRes = await lastValueFrom(
        this.analysisService.runPrediction(uploadRes.id)
      );
      return { uploadId: uploadRes.id, ...predictRes };
    },
    onSuccess: (data) => {
      this.router.navigate(['/dashboard/aivalidation', data.uploadId]);
    }
  }));

  onFileSelected(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    
    if (fileList && fileList.length > 0) {
      this.selectedFiles = Array.from(fileList);
      
      const file = this.selectedFiles[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreviewUrl.set(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        this.imagePreviewUrl.set(null);
      }
      
      this.analysisMutation.reset();
    }
  }

  canStartAnalysis(): boolean {
    return this.selectedFiles.length > 0 && 
           this.uploadForm.valid && 
           !this.analysisMutation.isPending();
  }

  startAnalysis() {
    if (this.canStartAnalysis()) {
      const { patientCin, modality } = this.uploadForm.value;
      this.analysisMutation.mutate({
        file: this.selectedFiles[0],
        patientCin,
        modality
      });
    } else {
      this.uploadForm.markAllAsTouched();
    }
  }

  reset() {
    this.analysisMutation.reset();
    this.uploadForm.reset({ modality: 'X-Ray' });
    this.selectedFiles = [];
    this.imagePreviewUrl.set(null);
    this.searchQuery.set('');
    this.selectedPatient.set(null);
  }
}

