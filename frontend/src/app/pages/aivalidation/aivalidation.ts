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

  // Image Viewer state
  zoom = signal<number>(1);
  contrast = signal<number>(100);
  brightness = signal<number>(100);
  isPanning = signal<boolean>(false);
  panX = signal<number>(0);
  panY = signal<number>(0);
  private startX = 0;
  private startY = 0;

  onMouseDown(event: MouseEvent) {
    if (!this.isPanning()) return;
    event.preventDefault();
    this.startX = event.clientX - this.panX();
    this.startY = event.clientY - this.panY();
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      this.panX.set(moveEvent.clientX - this.startX);
      this.panY.set(moveEvent.clientY - this.startY);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  zoomIn() {
    this.zoom.update(z => Math.min(z + 0.2, 5));
  }

  zoomOut() {
    this.zoom.update(z => Math.max(z - 0.2, 0.5));
  }

  togglePan() {
    this.isPanning.update(p => !p);
  }

  adjustContrast() {
    this.contrast.update(c => c === 100 ? 150 : c === 150 ? 200 : 100);
  }

  resetView() {
    this.zoom.set(1);
    this.contrast.set(100);
    this.brightness.set(100);
    this.isPanning.set(false);
    this.panX.set(0);
    this.panY.set(0);
  }

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

  // UI State
  showSuccessModal = signal<boolean>(false);

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
      this.showSuccessModal.set(true);
    }
  }));

  closeModal() {
    this.showSuccessModal.set(false);
    this.router.navigate(['/dashboard/patients']);
  }

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
