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
  imports: [CommonModule, FormsModule, WelcomeSection, ReportCard],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports {
  private reportService = inject(ReportService);

  // Filters
  modalityFilter = signal('All Modalities');
  dateFilter = signal('All Time');
  patientIdFilter = signal('');
  currentPage = signal(1);

  reportsQuery = injectQuery(() => ({
    queryKey: [
      'reports',
      this.modalityFilter(),
      this.dateFilter(),
      this.patientIdFilter(),
      this.currentPage(),
    ],
    queryFn: () =>
      lastValueFrom(
        this.reportService.getReports({
          search: this.patientIdFilter(),
          modality: this.modalityFilter() === 'All Modalities' ? '' : this.modalityFilter(),
          date_range: this.dateFilter() === 'All Time' ? '' : this.dateFilter(),
          page: this.currentPage(),
          page_size: 10,
        }),
      ),
  }));

  reports = computed<Report[]>(() => {
    const data: any = this.reportsQuery.data();
    if (!data || !data.results) return [];

    return data.results.map((item: ReportApiItem) => ({
      id: item.id,
      patientName: item.image?.patient_name ?? 'Unknown Patient',
      modality: this.normalizeModality(item.image?.modality),
      status: this.mapActionToStatus(item.diagnosis?.action),
      diagnosis: item.diagnosis?.final_finding ?? 'No finding recorded',
      doctor: `Radiologist #${item.generated_by}`,
      date: item.generated_at
        ? new Date(item.generated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '—',
      validated: true,
      reportId: item.id,
    }));
  });

  totalPages = computed(() => (this.reportsQuery.data() as any)?.total_pages || 1);
  totalItems = computed(() => (this.reportsQuery.data() as any)?.count || 0);

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  onFilterChange() {
    this.currentPage.set(1);
  }

  private normalizeModality(raw: string | undefined): 'MRI' | 'CT Scan' | 'X-Ray' {
    if (!raw) return 'X-Ray';
    const m = raw.toUpperCase();
    if (m.includes('MRI')) return 'MRI';
    if (m.includes('CT')) return 'CT Scan';
    return 'X-Ray';
  }

  private mapActionToStatus(action: string | undefined): 'Critical' | 'Moderate' | 'Normal' {
    switch (action) {
      case 'accepted':
        return 'Normal';
      case 'modified':
        return 'Moderate';
      case 'rejected':
        return 'Critical';
      default:
        return 'Normal';
    }
  }
}
