import { Component, inject, input } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { ReportService } from '../../services/reportService';
import { AnalysisService } from '../../services/analysisService';

export interface Report {
  id: string;
  patientName: string;
  modality: 'MRI' | 'X-Ray' | 'CT';
  status: 'Critical' | 'Moderate' | 'Normal';
  diagnosis: string;
  doctor: string;
  date: string;
  validated: boolean;
  reportId?: string;
  imageId?: string;
}

@Component({
  selector: 'app-report-card',
  imports: [],
  templateUrl: './report-card.html',
  styleUrl: './report-card.css'
})
export class ReportCard {
  readonly report = input.required<Report>();
  private reportService = inject(ReportService);
  private analysisService = inject(AnalysisService);

  imageQuery = injectQuery(() => ({
    queryKey: ['reportImage', this.report().imageId],
    queryFn: () => this.report().imageId
      ? lastValueFrom(this.analysisService.getImageDetail(this.report().imageId!))
      : Promise.resolve(null),
    enabled: !!this.report().imageId,
  }));

  download() {
    const currentReport = this.report();
    const id = currentReport.reportId ?? currentReport.id;
    this.reportService.downloadReport(id);
  }

  get initials(): string {
    const doctor = this.report().doctor;
    if (!doctor || doctor.includes('#')) return 'RA'; // Fallback for "Radiologist #30"
    return doctor.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  get statusBadgeClass(): string {
    const status = this.report().status;
    switch (status) {
      case 'Critical':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'Moderate':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Normal':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  }

  get modalityBadgeClass(): string {
    return 'bg-primary/5 text-primary border-primary/10';
  }

  get doctorDisplayName(): string {
    const doctor = this.report().doctor;
    if (doctor.includes('#')) return 'Dr. AI Assistant';
    return doctor;
  }
}
