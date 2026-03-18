import { Component } from '@angular/core';
import { WelcomeSection } from '../../components/welcome-section/welcome-section';
import { StatsSummary, StatItem } from '../../components/stats-summary/stats-summary';

@Component({
  selector: 'app-radiologist',
  imports: [WelcomeSection, StatsSummary],
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
}
