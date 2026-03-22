import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

export interface WorklistItem {
  id: string;
  patient: {
    initials: string;
    name: string;
    id: string;
    isEmergency?: boolean;
  };
  modality: string;
  uploadDate: {
    time: string;
    date: string;
  };
  aiStatus: string;
  action: {
    type: 'analyze' | 'view' | 'critical';
    text: string;
  };
}

@Component({
  selector: 'app-worklist-table',
  imports: [RouterModule],
  templateUrl: './worklist-table.html',
  styleUrl: './worklist-table.css',
})
export class WorklistTable {
  @Input() columns: string[] = [];
  @Input() data: WorklistItem[] = [];
  @Input() totalItems?: number;
  @Input() hideFooter: boolean = false;

  getModalityClass(modality: string): string {
    switch (modality) {
      case 'X-Ray': return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 ring-indigo-700/10';
      case 'CT Scan': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-700/10';
      case 'MRI': return 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-purple-700/10';
      default: return 'bg-slate-50 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 ring-slate-700/10';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 ring-amber-700/10';
      case 'Analyzed': return 'bg-blue-50 dark:bg-primary/10 text-primary ring-primary/20';
      case 'Validated': return 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 ring-green-700/10';
      default: return 'bg-slate-50 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 ring-slate-700/10';
    }
  }

  getStatusDotClass(status: string): string {
    switch (status) {
      case 'Pending': return 'bg-amber-500 animate-pulse';
      case 'Analyzed': return 'bg-primary';
      case 'Validated': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  }
}
