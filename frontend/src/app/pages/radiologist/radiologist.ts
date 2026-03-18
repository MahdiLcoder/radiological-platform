import { Component } from '@angular/core';
import { WelcomeSection } from '../../components/welcome-section/welcome-section';
import { StatsSummary, StatItem } from '../../components/stats-summary/stats-summary';
import { WorklistTable, WorklistItem } from '../../components/worklist-table/worklist-table';

@Component({
  selector: 'app-radiologist',
  imports: [WelcomeSection, StatsSummary, WorklistTable],
  templateUrl: './radiologist.html',
  styleUrl: './radiologist.css',
})
export class Radiologist {
  summaryStats: StatItem[] = [
    {
      title: 'Pending Analysis',
      value: '12',
      trendText: '+2.4% vs last hour',
      trendColorClass: 'text-green-500',
      trendIcon: 'trending_up',
      icon: 'hourglass_empty',
      iconColorClass: 'text-amber-600 dark:text-amber-500',
      iconBgClass: 'bg-amber-100 dark:bg-amber-500/10'
    },
    {
      title: 'Analyzed Today',
      value: '45',
      trendText: '-5.1% vs yesterday',
      trendColorClass: 'text-red-500',
      trendIcon: 'trending_down',
      icon: 'smart_toy',
      iconColorClass: 'text-primary',
      iconBgClass: 'bg-blue-100 dark:bg-primary/10'
    },
    {
      title: 'Critical Findings',
      value: '3',
      valueColorClass: 'text-red-500',
      trendText: 'Requires immediate review',
      trendColorClass: 'text-slate-500 dark:text-slate-400',
      icon: 'emergency',
      iconColorClass: 'text-red-600 dark:text-red-500',
      iconBgClass: 'bg-red-100 dark:bg-red-500/10'
    }
  ];

  tableColumns: string[] = ['Patient Details', 'Modality', 'Upload Date', 'AI Status', 'Actions'];

  worklistData: WorklistItem[] = [
    {
      id: '1',
      patient: { initials: 'JD', name: 'John Doe', id: 'PX-102-45A' },
      modality: 'X-Ray',
      uploadDate: { time: '10:30 AM', date: 'Oct 12, 2023' },
      aiStatus: 'Pending',
      action: { type: 'analyze', text: 'Analyze Study' }
    },
    {
      id: '2',
      patient: { initials: 'JS', name: 'Jane Smith', id: 'PX-105-99B' },
      modality: 'CT Scan',
      uploadDate: { time: '09:15 AM', date: 'Oct 12, 2023' },
      aiStatus: 'Analyzed',
      action: { type: 'view', text: 'View Results' }
    },
    {
      id: '3',
      patient: { initials: 'RB', name: 'Robert Brown', id: 'PX-108-22F', isEmergency: true },
      modality: 'MRI',
      uploadDate: { time: '08:00 AM', date: 'Oct 12, 2023' },
      aiStatus: 'Validated',
      action: { type: 'critical', text: 'Critical Review' }
    },
    {
      id: '4',
      patient: { initials: 'AM', name: 'Alice Miller', id: 'PX-112-88C' },
      modality: 'CT Scan',
      uploadDate: { time: '07:45 AM', date: 'Oct 12, 2023' },
      aiStatus: 'Analyzed',
      action: { type: 'view', text: 'View Results' }
    }
  ];
}
