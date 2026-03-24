import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../services/authService';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, NgxEchartsModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics {
  private authService = inject(AuthService);

  statsQuery = injectQuery(() => ({
    queryKey: ['system-stats'],
    queryFn: () => lastValueFrom(this.authService.getStats()),
  }));

  trendOptions = computed<EChartsOption>(() => {
    const data = this.statsQuery.data()?.images?.trend || [];
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 0,
        textStyle: { color: '#1e293b' },
        extraCssText: 'shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);'
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((d: any) => d.date.split('-').slice(1).join('/')),
        axisLine: { lineStyle: { color: '#94a3b8' } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      series: [
        {
          name: 'Scans',
          type: 'bar',
          data: data.map((d: any) => d.count as number),
          itemStyle: {
            color: '#3b82f6',
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: '60%'
        }
      ]
    };
  });

  modalityOptions = computed<EChartsOption>(() => {
    const dist = this.statsQuery.data()?.images?.by_modality || {};
    return {
      tooltip: { trigger: 'item' },
      color: ['#0d9488', '#2563eb', '#8b5cf6', '#06b6d4'],
      series: [
        {
          type: 'pie',
          radius: ['50%', '80%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
          data: Object.entries(dist).map(([name, value]) => ({ name, value: value as number }))
        }
      ]
    };
  });


  getModalityColor(modality: string): string {
    const colors: Record<string, string> = {
      'X-Ray': 'bg-teal-500',
      'CT': 'bg-blue-600',
      'MRI': 'bg-violet-500'
    };
    return colors[modality] || 'bg-slate-400';
  }

  getFindingIcon(name: string): string {
    const icons: Record<string, string> = {
      'Pneumonia': 'pulmonology',
      'Fracture': 'skeleton',
      'Nodule': 'biotech',
      'Hemorrhage': 'neurology'
    };
    return icons[name] || 'analytics';
  }
}

