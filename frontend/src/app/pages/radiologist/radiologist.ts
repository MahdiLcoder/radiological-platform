import { Component, inject, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WelcomeSection } from '../../components/welcome-section/welcome-section';
import { StatsSummary, StatItem } from '../../components/stats-summary/stats-summary';
import { WorklistTable, WorklistItem } from '../../components/worklist-table/worklist-table';
import { RadiologyCharts } from '../../components/radiology-charts/radiology-charts';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AnalysisService } from '../../services/analysisService';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-radiologist',
  imports: [
    CommonModule,
    WelcomeSection,
    StatsSummary,
    WorklistTable,
    RouterModule,
    RadiologyCharts,
  ],
  templateUrl: './radiologist.html',
  styleUrl: './radiologist.css',
})
export class Radiologist {
  private analysisService = inject(AnalysisService);

  tableColumns: string[] = ['Patient Details', 'Modality', 'Upload Date', 'AI Status', 'Actions'];

  imagesQuery = injectQuery(() => ({
    queryKey: ['recent_images_radiologist'],
    queryFn: () => lastValueFrom(this.analysisService.getAllImages({ page_size: 5 })),
  }));

  summaryStats = computed<StatItem[]>(() => {
    const rawData: any = this.imagesQuery.data();
    const stats = rawData?.stats || { pending: 0, analyzed: 0, total: 0 };

    return [
      {
        title: 'Pending Analysis',
        value: stats.pending.toString(),
        trendText: 'Real-time queue',
        trendColorClass: 'text-slate-500',
        icon: 'hourglass_empty',
        iconColorClass: 'text-amber-600 dark:text-amber-500',
        iconBgClass: 'bg-amber-100 dark:bg-amber-500/10'
      },
      {
        title: 'Analyzed Scans',
        value: stats.analyzed.toString(),
        trendText: 'Total completed',
        trendColorClass: 'text-emerald-500',
        icon: 'smart_toy',
        iconColorClass: 'text-primary',
        iconBgClass: 'bg-blue-100 dark:bg-primary/10'
      },
      {
        title: 'Total Scans',
        value: stats.total.toString(),
        trendText: 'All time uploads',
        trendColorClass: 'text-slate-500',
        icon: 'folder_open',
        iconColorClass: 'text-indigo-600 dark:text-indigo-500',
        iconBgClass: 'bg-indigo-100 dark:bg-indigo-500/10'
      }
    ];
  });

  worklistData = computed<WorklistItem[]>(() => {
    const rawData: any = this.imagesQuery.data();
    const images: any[] = rawData?.results || [];

    return images.map(img => {
      const p = img.patient;
      const fName = p?.first_name || '';
      const lName = p?.last_name || '';
      const initials = ((fName[0] || '') + (lName[0] || '')).toUpperCase() || 'UK';
      const name = `${fName} ${lName}`.trim() || 'Unknown Patient';
      
      let uploadDate = new Date(img.uploaded_at);
      let timeStr = uploadDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      let dateStr = uploadDate.toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'});

      let aiStatus = 'Pending';
      let actionType: 'analyze' | 'view' | 'critical' = 'analyze';
      let actionText = 'Analyze Study';

      if (img.status === 'analyzed') {
        aiStatus = 'Analyzed';
        actionType = 'view';
        actionText = 'Validate Results';
      } else if (img.status === 'validated') {
        aiStatus = 'Validated';
        actionType = 'view';
        actionText = 'View Results';
      }

      return {
        id: img.id,
        patient: {
          initials,
          name,
          patientCin: p?.cin || 'Unknown',
        },
        modality: img.modality,
        uploadDate: {
          time: timeStr,
          date: dateStr
        },
        aiStatus,
        action: {
          type: actionType,
          text: actionText,
          link: ['/dashboard/aivalidation', img.id]
        }
      };
    }).sort((a, b) => new Date(b.uploadDate.date + ' ' + b.uploadDate.time).getTime() - new Date(a.uploadDate.date + ' ' + a.uploadDate.time).getTime());
  });
}
