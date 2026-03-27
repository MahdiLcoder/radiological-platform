import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { PatientService } from '../../services/patientService';
import { ReportService } from '../../services/reportService';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
    queryKey: ['patient', this.patientId],
    queryFn: () => lastValueFrom(this.patientService.getById(this.patientId!)),
    enabled: !!this.patientId
  }));

  getInitials(firstName: string = '', lastName: string = ''): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
