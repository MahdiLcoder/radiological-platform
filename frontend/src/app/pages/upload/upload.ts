import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AnalysisService } from '../../services/analysisService';
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
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  uploadForm: FormGroup;
  selectedFiles: File[] = [];
  imagePreviewUrl = signal<string | null>(null);

  constructor() {
    this.uploadForm = this.fb.group({
      patientId: ['', [Validators.required]],
      modality: ['X-Ray', [Validators.required]]
    });
  }

  // Unified Analysis Mutation (Upload -> Run Prediction)
  analysisMutation = injectMutation(() => ({
    mutationFn: async (data: { file: File; patientId: string; modality: string }) => {
      const uploadRes = await lastValueFrom(
        this.analysisService.uploadImage(data.file, data.patientId, data.modality)
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
      const { patientId, modality } = this.uploadForm.value;
      this.analysisMutation.mutate({
        file: this.selectedFiles[0],
        patientId,
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
  }
}

