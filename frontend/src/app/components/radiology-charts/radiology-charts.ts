import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import { WorklistItem } from '../worklist-table/worklist-table';

@Component({
  selector: 'app-radiology-charts',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  templateUrl: './radiology-charts.html',
  styleUrl: './radiology-charts.css'
})
export class RadiologyCharts implements OnChanges {
  @Input() data: WorklistItem[] = [];

  modalityOptions: any = {};
  statusOptions: any = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.initCharts();
    }
  }

  private initCharts() {
    if (!this.data || this.data.length === 0) {
      this.setDefaultOptions();
      return;
    }

    // Modern color palette
    const bgColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

    // Modality Chart Data
    const modalityCount = this.data.reduce((acc: any, item) => {
      const mod = item.modality || 'Unknown';
      acc[mod] = (acc[mod] || 0) + 1;
      return acc;
    }, {});

    const modalityPieData = Object.keys(modalityCount).map(key => ({
      name: key,
      value: modalityCount[key]
    }));

    this.modalityOptions = {
      color: bgColors,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#0f172a' },
        borderRadius: 8,
        padding: 12,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      },
      legend: {
        bottom: '0%',
        left: 'center',
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#64748b', fontSize: 12, fontWeight: 'bold' }
      },
      series: [
        {
          name: 'Modality',
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 3
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold',
              color: '#0f172a'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.1)'
            }
          },
          labelLine: { show: false },
          data: modalityPieData
        }
      ]
    };

    // Status Chart Data
    const statusCount = this.data.reduce((acc: any, item) => {
      const st = item.aiStatus || 'Pending';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});

    const statusKeys = Object.keys(statusCount);
    const statusValues = statusKeys.map(key => statusCount[key]);

    this.statusOptions = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#0f172a' },
        borderRadius: 8,
        padding: 12,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      },
      grid: {
        left: '2%',
        right: '4%',
        bottom: '5%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: statusKeys,
        axisTick: { alignWithLabel: true, show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontWeight: 'bold', margin: 12 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { color: '#94a3b8' }
      },
      series: [
        {
          name: 'Scans',
          type: 'bar',
          barWidth: '40%',
          data: statusValues,
          itemStyle: {
             color: '#10b981',
             borderRadius: [6, 6, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: '#059669'
            }
          }
        }
      ]
    };
  }

  private setDefaultOptions() {
    this.modalityOptions = {};
    this.statusOptions = {};
  }
}
