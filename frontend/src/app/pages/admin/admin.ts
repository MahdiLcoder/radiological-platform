import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../../services/authService';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
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
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#0f172a', fontSize: 12, fontWeight: 'bold' },
        padding: [10, 15],
        borderRadius: 8,
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.05)',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(30, 64, 175, 0.03)' } }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((d: any) => d.date.split('-').slice(1).join('/')),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
        axisLabel: { color: '#64748b', fontSize: 10, fontWeight: 'bold', margin: 15 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 }
      },
      series: [
        {
          name: 'Scans',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: data.map((d: any) => d.count as number),
          itemStyle: {
            color: '#1e40af',
          },
          lineStyle: {
            width: 3,
            color: '#1e40af',
            shadowBlur: 10,
            shadowColor: 'rgba(30, 64, 175, 0.3)'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(30, 64, 175, 0.15)' },
                { offset: 1, color: 'rgba(30, 64, 175, 0.01)' }
              ]
            }
          },
          emphasis: { 
            scale: true,
            lineStyle: { width: 4 }
          }
        }
      ]
    };
  });

  modalityOptions = computed<EChartsOption>(() => {
    const dist = this.statsQuery.data()?.images?.by_modality || {};
    return {
      tooltip: { 
        trigger: 'item', 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        borderColor: '#e2e8f0',
        borderWidth: 1,
        borderRadius: 8,
        textStyle: { color: '#0f172a', fontWeight: 'bold' },
        padding: 12
      },
      color: ['#0d9488', '#1e40af', '#6366f1', '#06b6d4'],
      series: [
        {
          type: 'pie',
          radius: ['55%', '85%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 4 },
          label: { show: false },
          emphasis: { 
            scale: true,
            label: { show: true, fontSize: 16, fontWeight: 900, color: '#1e40af' } 
          },
          data: Object.entries(dist).map(([name, value]) => ({ name, value: value as number }))
        }
      ]
    };
  });

  statusOptions = computed<EChartsOption>(() => {
    const dist = this.statsQuery.data()?.images?.by_status || {};
    const labels: Record<string, string> = {
      'validated': 'Validated',
      'analyzed': 'Analyzed (AI)',
      'rejected': 'Rejected',
      'pending': 'Pending'
    };
    return {
      tooltip: { 
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 8,
        textStyle: { color: '#0f172a', fontWeight: 'bold' }
      },
      color: ['#10b981', '#1e40af', '#ef4444', '#f59e0b'],
      legend: {
        bottom: '0%',
        left: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: '#64748b', fontSize: 10, fontWeight: 'bold' }
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          data: Object.entries(dist).map(([name, value]) => ({ 
            name: labels[name] || name, 
            value: value as number 
          })),
          label: { show: false },
          emphasis: {
            itemStyle: { shadowBlur: 15, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.1)' }
          }
        }
      ]
    };
  });

  confidenceOptions = computed<EChartsOption>(() => {
    const avg = (this.statsQuery.data()?.findings?.avg_confidence || 0) * 100;
    return {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 5,
          radius: '100%',
          center: ['50%', '75%'],
          progress: { 
            show: true, 
            width: 14, 
            itemStyle: { 
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#1e40af' }]
              }
            } 
          },
          pointer: { show: false },
          axisLine: { lineStyle: { width: 14, color: [[1, '#f1f5f9']] } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            fontSize: 28,
            fontWeight: 900,
            offsetCenter: [0, -5],
            color: '#1e40af'
          },
          data: [{ value: parseFloat(avg.toFixed(1)) }]
        }
      ]
    };
  });


  getModalityColor(modality: string): string {
    const colors: Record<string, string> = {
      'X-Ray': 'bg-[#0d9488]',
      'CT': 'bg-[#1e40af]',
      'MRI': 'bg-[#6366f1]',
      'CT Scan': 'bg-[#1e40af]'
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

