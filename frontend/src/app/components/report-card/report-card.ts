import { Component, Input } from '@angular/core';

export interface Report {
  id: string;
  patientName: string;
  modality: 'MRI' | 'CT Scan' | 'X-Ray';
  status: 'Critical' | 'Moderate' | 'Normal';
  diagnosis: string;
  doctor: string;
  date: string;
  validated: boolean;
}

@Component({
  selector: 'app-report-card',
  imports: [],
  templateUrl: './report-card.html',
  styleUrl: './report-card.css'
})
export class ReportCard {
  @Input({ required: true }) report!: Report;

  get modalityClass(): string {
    switch (this.report.modality) {
      case 'MRI':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
      case 'X-Ray':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'CT Scan':
        return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300';
      default:
        return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';
    }
  }

  get statusClass(): string {
    switch (this.report.status) {
      case 'Critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'Moderate':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500';
      case 'Normal':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      default:
        return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';
    }
  }
}
