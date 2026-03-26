import { Component, input } from '@angular/core';

export interface StatItem {
  title: string;
  value: string | number;
  valueColorClass?: string;
  trendText: string;
  trendColorClass?: string;
  trendIcon?: string;
  icon: string;
  iconColorClass: string;
  iconBgClass: string;
}

@Component({
  selector: 'app-stats-summary',
  imports: [],
  templateUrl: './stats-summary.html',
  styleUrl: './stats-summary.css',
})
export class StatsSummary {
  readonly stats = input<StatItem[]>([]);
}
