import { Component, inject, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WelcomeSection } from '../../components/welcome-section/welcome-section';
import { StatsSummary, StatItem } from '../../components/stats-summary/stats-summary';
import { ReportCard, Report } from '../../components/report-card/report-card';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { PatientService, Patient } from '../../services/patientService';
import { ReportService, ReportApiItem } from '../../services/reportService';
import { WorklistTable, WorklistItem } from '../../components/worklist-table/worklist-table';

@Component({
  selector: 'app-doctor',
  standalone: true,
  imports: [CommonModule, RouterModule, WelcomeSection, StatsSummary, ReportCard, WorklistTable],
  templateUrl: './doctor.html',
  styleUrl: './doctor.css',
})
export class Doctor {
  private patientService = inject(PatientService);
  private reportService = inject(ReportService);

  tableColumns: string[] = ['Patient', 'Reference', 'Demographics', 'Last Sync', 'Details'];

  // ── Queries ──────────────────────────────────────────────────────
  patientsQuery = injectQuery(() => ({
    queryKey: ['doctor_patients_summary'],
    queryFn: () => lastValueFrom(this.patientService.getAll({ page: 1, page_size: 5 })),
  }));

  reportsQuery = injectQuery(() => ({
    queryKey: ['doctor_reports_recent'],
    queryFn: () => lastValueFrom(this.reportService.getReports({ page: 1, page_size: 4 })),
  }));

  // ── Stats cards ───────────────────────────────────────────────────
  summaryStats = computed<StatItem[]>(() => {
    const patientData: any = this.patientsQuery.data();
    const reportData: any  = this.reportsQuery.data();

    const totalPatients = patientData?.count ?? 0;
    const totalReports  = reportData?.count  ?? 0;

    return [
      {
        title: 'My Patients',
        value: totalPatients.toString(),
        trendText: 'Registered under care',
        trendColorClass: 'text-slate-500',
        icon: 'groups',
        iconColorClass: 'text-blue-600 dark:text-blue-400',
        iconBgClass: 'bg-blue-100 dark:bg-blue-500/10',
      },
      {
        title: 'Diagnostic Reports',
        value: totalReports.toString(),
        trendText: 'Total validated findings',
        trendColorClass: 'text-emerald-500',
        icon: 'clinical_notes',
        iconColorClass: 'text-emerald-600 dark:text-emerald-400',
        iconBgClass: 'bg-emerald-100 dark:bg-emerald-500/10',
      },
      {
        title: 'Pending Review',
        value: ((patientData as any)?.stats?.pending ?? 0).toString(),
        trendText: 'Awaiting clinical decision',
        trendColorClass: 'text-amber-500',
        icon: 'hourglass_empty',
        iconColorClass: 'text-amber-600 dark:text-amber-400',
        iconBgClass: 'bg-amber-100 dark:bg-amber-500/10',
      },
    ];
  });

  // ── Admissions Table Data ─────────────────────────────────────────
  worklistData = computed<WorklistItem[]>(() => {
    const data: any = this.patientsQuery.data();
    const results = data?.results ?? [];
    
    return results.map((patient: Patient) => {
      const initials = this.getInitials(patient.first_name, patient.last_name);
      const name = `${patient.first_name} ${patient.last_name}`;
      const age = this.calculateAge(patient.date_of_birth);
      const gender = patient.gender === 'M' ? 'M' : (patient.gender === 'F' ? 'F' : 'O');
      const createdAt = new Date(patient.created_at || new Date());
      
      return {
        id: patient.id || 'N/A',
        patient: {
          initials,
          name,
          id: (patient.id || 'N/A').substring(0, 8).toUpperCase(),
          isEmergency: false
        },
        modality: `REF-${(patient.id?.substring(0, 6) || 'NA').toUpperCase()}`,
        uploadDate: {
          time: createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          date: createdAt.toLocaleDateString([], {month: 'short', day: 'numeric'})
        },
        aiStatus: `${gender} • ${age}Y`,
        action: {
          type: 'view',
          text: 'Open File',
          link: ['/dashboard/patient-detail', patient.id]
        }
      };
    });
  });

  // ── Recent reports mapped to ReportCard format ────────────────────
  recentReports = computed<Report[]>(() => {
    const data: any = this.reportsQuery.data();
    const items: ReportApiItem[] = data?.results ?? [];
    return items.map(item => ({
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

  private getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase() || 'P';
  }

  private calculateAge(dob: string | undefined): number | string {
    if (!dob) return 'N/A';
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age;
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
      case 'accepted': return 'Normal';
      case 'modified': return 'Moderate';
      case 'rejected': return 'Critical';
      default:         return 'Normal';
    }
  }
}
