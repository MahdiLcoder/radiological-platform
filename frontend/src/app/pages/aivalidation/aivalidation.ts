import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AnalysisService, AnalysisResult } from '../../services/analysisService';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-aivalidation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aivalidation.html',
  styleUrl: './aivalidation.css',
})
export class Aivalidation {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private analysisService = inject(AnalysisService);

  imageId = this.route.snapshot.params['id'];
  
  // Form state
  selectedDiagnosis = signal<string>('');
  clinicalNotes = signal<string>('');

  // Fetch Image Detail
  imageQuery = injectQuery(() => ({
    queryKey: ['image', this.imageId],
    queryFn: () => lastValueFrom(this.analysisService.getImageDetail(this.imageId)),
  }));

  // Fetch AI Prediction
  predictionQuery = injectQuery<AnalysisResult>(() => ({
    queryKey: ['prediction', this.imageId],
    queryFn: () => lastValueFrom(this.analysisService.getPrediction(this.imageId)),
  }));

  // Validation Mutation
  validationMutation = injectMutation(() => ({
    mutationFn: (data: { action: 'accepted' | 'rejected' | 'modified' }) => 
      lastValueFrom(this.analysisService.createDiagnosis({
        image: this.imageId,
        ai_prediction: this.predictionQuery.data()?.id,
        action: data.action,
        final_finding: this.selectedDiagnosis() || this.predictionQuery.data()?.top_finding,
        clinical_notes: this.clinicalNotes() || `AI Prediction validation: ${data.action}`
      })),
    onSuccess: () => {
      alert('Validation saved successfully!');
      this.router.navigate(['/dashboard/patients']);
    }
  }));

  constructor() {
    console.log('Aivalidation initialized with imageId:', this.imageId);
    
    effect(() => {
      const data = this.predictionQuery.data();
      const error = this.predictionQuery.error();
      if (data) {
        console.log('Prediction loaded:', data);
        if (!this.selectedDiagnosis()) {
          this.selectedDiagnosis.set(data.top_finding);
        }
      }
      if (error) {
        console.error('Prediction query error:', error);
      }
    });

    effect(() => {
      const data = this.imageQuery.data();
      const error = this.imageQuery.error();
      if (data) {
        console.log('Image details loaded:', data);
      }
      if (error) {
        console.error('Image query error:', error);
      }
    });
  }

  confirmFindings() {
    this.validationMutation.mutate({ action: 'accepted' });
  }

  rejectFindings() {
      this.validationMutation.mutate({ action: 'rejected' });
  }
}
