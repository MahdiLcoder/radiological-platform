import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeSection } from '../../components/welcome-section/welcome-section';
import { FiltersSection, FilterField } from '../../components/filters-section/filters-section';
import { ReportCard, Report } from '../../components/report-card/report-card';
import { ReportService, ReportApiItem } from '../../services/reportService';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, WelcomeSection, FiltersSection, ReportCard],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports {
  private reportService = inject(ReportService);

  reportFilters: FilterField[] = [
    {
      label: 'Date Range',
      type: 'select',
      icon: 'calendar_today',
      options: ['Last 7 Days', 'Last 30 Days', 'Custom Range']
    },
    {
      label: 'Patient ID',
      type: 'text',
      placeholder: 'Ex: PT-9821'
    }
  ];

  reportsQuery = injectQuery(() => ({
    queryKey: ['reports'],
    queryFn: () => lastValueFrom(this.reportService.getReports()),
  }));

  /** Map backend ReportApiItem → ReportCard Report */
  reports = computed<Report[]>(() => {
    const data = this.reportsQuery.data();
    if (!data) return [];
    return data.map((item: ReportApiItem) => ({
      id: item.id,
      patientName: item.image?.patient_name ?? 'Unknown Patient',
      modality: this.normalizeModality(item.image?.modality),
      status: this.mapActionToStatus(item.diagnosis?.action),
      diagnosis: item.diagnosis?.final_finding ?? 'No finding recorded',
      doctor: `Radiologist #${item.generated_by}`,
      date: item.generated_at
        ? new Date(item.generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '—',
      validated: true,
      reportId: item.id,
    }));
  });

  private normalizeModality(raw: string | undefined): 'MRI' | 'CT Scan' | 'X-Ray' {
    if (!raw) return 'X-Ray';
    const m = raw.toUpperCase();
    if (m.includes('MRI')) return 'MRI';
    if (m.includes('CT')) return 'CT Scan';
    return 'X-Ray';
  }

  private mapActionToStatus(action: string | undefined): 'Critical' | 'Moderate' | 'Normal' {
    switch (action) {
      case 'accepted':  return 'Normal';
      case 'modified':  return 'Moderate';
      case 'rejected':  return 'Critical';
      default:          return 'Normal';
    }
  }
}
