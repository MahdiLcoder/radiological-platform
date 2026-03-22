import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WelcomeSection } from '../../components/welcome-section/welcome-section';
import { FiltersSection, FilterField } from '../../components/filters-section/filters-section';
import { ReportCard, Report } from '../../components/report-card/report-card';
import { ReportService, ReportApiItem } from '../../services/reportService';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, WelcomeSection, FiltersSection, ReportCard],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports {
  private reportService = inject(ReportService);

  // Filters
  modalityFilter = signal('All Modalities');
  dateFilter = signal('All Time');
  patientIdFilter = signal('');

  reportsQuery = injectQuery(() => ({
    queryKey: ['reports'],
    queryFn: () => lastValueFrom(this.reportService.getReports()),
  }));

  reports = computed<Report[]>(() => {
    const data = this.reportsQuery.data();
    if (!data) return [];
    
    let filtered = data.map((item: ReportApiItem) => ({
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

    const mod = this.modalityFilter();
    if (mod !== 'All Modalities') {
      filtered = filtered.filter(r => r.modality === mod);
    }

    const pid = this.patientIdFilter().toLowerCase().trim();
    if (pid) {
      filtered = filtered.filter(r => r.patientName.toLowerCase().includes(pid) || r.id.toLowerCase().includes(pid));
    }

    const dR = this.dateFilter();
    if (dR !== 'All Time') {
      const now = new Date();
      filtered = filtered.filter(r => {
        if (!r.date || r.date === '—') return false;
        const d = new Date(r.date);
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        if (dR === 'Last 7 Days') return diffDays <= 7;
        if (dR === 'Last 30 Days') return diffDays <= 30;
        return true;
      });
    }

    return filtered;
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
