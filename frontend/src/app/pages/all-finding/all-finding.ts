import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AnalysisService } from '../../services/analysisService';

@Component({
  selector: 'app-all-finding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './all-finding.html',
  styleUrl: './all-finding.css',
})
export class AllFinding {
  private analysisService = inject(AnalysisService);

  // Pagination & Filtering State
  currentPage = signal(1);
  pageSize = signal(10);
  
  selectedModality = signal('All');
  selectedStatus = signal('All');
  minConfidence = signal(0);
  
  findingsQuery = injectQuery(() => ({
    queryKey: ['all-findings', this.currentPage(), this.selectedModality(), this.selectedStatus(), this.minConfidence()],
    queryFn: () => lastValueFrom(this.analysisService.getAllFindings({
      page: this.currentPage(),
      page_size: this.pageSize(),
      modality: this.selectedModality(),
      status: this.selectedStatus(),
      confidence_min: this.minConfidence()
    })),
  }));

  // Helper Methods
  nextPage() {
    const data = this.findingsQuery.data();
    if (data && this.currentPage() * this.pageSize() < data.count) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  clearFilters() {
    this.selectedModality.set('All');
    this.selectedStatus.set('All');
    this.minConfidence.set(0);
    this.currentPage.set(1);
  }

  getFindingIcon(type: string): string {
    const icons: Record<string, string> = {
      'Pneumonia': 'pulmonology',
      'Bone Fracture': 'skeleton',
      'Tibia Fracture': 'skeleton',
      'Pulmonary Nodule': 'grain',
      'Pleural Effusion': 'water_drop',
    };
    return icons[type] || 'analytics';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'validated': 'Validated',
      'analyzed': 'Pending Review',
      'pending': 'In Queue',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'validated': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
      'analyzed': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      'pending': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    };
    return classes[status] || classes['pending'];
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'validated': 'bg-emerald-500',
      'analyzed': 'bg-amber-500',
      'pending': 'bg-slate-400',
    };
    return icons[status] || 'bg-slate-400';
  }

  getConfidenceColor(score: number): string {
    if (score >= 0.9) return 'bg-emerald-500';
    if (score >= 0.7) return 'bg-amber-500';
    return 'bg-red-500';
  }
}

