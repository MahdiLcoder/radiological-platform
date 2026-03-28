import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { PatientService } from '../../services/patientService';
import { ReportService } from '../../services/reportService';
import { LoadingStateComponent } from '../../components/loading-state/loading-state';
import { ErrorStateComponent } from '../../components/error-state/error-state';
import { EmptyStateComponent } from '../../components/empty-state/empty-state';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.css'
})
export class PatientDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientService = inject(PatientService);
  private reportService = inject(ReportService);

  patientId = this.route.snapshot.paramMap.get('id');

  patientQuery = injectQuery(() => ({
    queryKey: ['patient', this.patientId, this.scanSortOrder()],
    queryFn: () => lastValueFrom(this.patientService.getById(this.patientId!, this.scanSortOrder())),
    enabled: !!this.patientId
  }));

  scanSortOrder = signal<'desc' | 'asc'>('desc');

  toggleScanSort(): void {
    this.scanSortOrder.update(o => (o === 'desc' ? 'asc' : 'desc'));
  }

  calculateAge(dob: string | undefined): number {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /** Navigate to the AI Validation page for this image */
  viewScan(imageId: string): void {
    this.router.navigate(['/dashboard/aivalidation', imageId]);
  }

  /** Download the PDF report associated with this image */
  downloadScanReport(imageId: string): void {
    this.reportService.downloadReportByImageId(imageId);
  }
}
