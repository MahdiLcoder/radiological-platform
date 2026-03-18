import { Component } from '@angular/core';
import { WelcomeSection } from '../../components/welcome-section/welcome-section';
import { FiltersSection, FilterField } from '../../components/filters-section/filters-section';
import { ReportCard, Report } from '../../components/report-card/report-card';

@Component({
  selector: 'app-reports',
  imports: [WelcomeSection, FiltersSection, ReportCard],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports {
  reportFilters: FilterField[] = [
    {
      label: 'Date Range',
      type: 'select',
      icon: 'calendar_today',
      options: ['Last 7 Days', 'Last 30 Days', 'Custom Range']
    },
    {
      label: 'Patient ID',
      type: 'text',
      placeholder: 'Ex: PT-9821'
    }
  ];

  reports: Report[] = [
    {
      id: 'PT-11204',
      patientName: 'Sarah Jenkins',
      modality: 'MRI',
      status: 'Critical',
      diagnosis: 'Evidence of acute ischemic stroke in the right middle cerebral artery territory. Urgent intervention required.',
      doctor: 'Dr. Alan Vance',
      date: 'Oct 24, 2023',
      validated: true
    },
    {
      id: 'PT-09552',
      patientName: 'Robert Chen',
      modality: 'X-Ray',
      status: 'Normal',
      diagnosis: 'Bilateral lung fields are clear. Normal cardiomediastinal silhouette. No pneumothorax detected.',
      doctor: 'Dr. Elena Kostic',
      date: 'Oct 23, 2023',
      validated: true
    },
    {
      id: 'PT-22391',
      patientName: "Michael O'Brien",
      modality: 'CT Scan',
      status: 'Moderate',
      diagnosis: 'Non-obstructive renal calculi in the lower pole of the right kidney. Follow-up recommended in 6 months.',
      doctor: 'Dr. Alan Vance',
      date: 'Oct 21, 2023',
      validated: true
    },
    {
      id: 'PT-04429',
      patientName: 'Linda Thompson',
      modality: 'MRI',
      status: 'Moderate',
      diagnosis: 'Disc protrusion at L4-L5 causing moderate narrowing. Correlate with clinical symptoms of sciatica.',
      doctor: 'Dr. Sarah Mills',
      date: 'Oct 20, 2023',
      validated: true
    },
    {
      id: 'PT-33104',
      patientName: 'David Miller',
      modality: 'CT Scan',
      status: 'Critical',
      diagnosis: 'Evidence of type A aortic dissection. Immediate cardiothoracic surgery consultation initiated.',
      doctor: 'Dr. Elena Kostic',
      date: 'Oct 19, 2023',
      validated: true
    },
    {
      id: 'PT-18302',
      patientName: 'Amanda Blake',
      modality: 'X-Ray',
      status: 'Normal',
      diagnosis: 'Uterus and ovaries appear within normal limits. No pelvic free fluid or suspicious masses identified.',
      doctor: 'Dr. Sarah Mills',
      date: 'Oct 18, 2023',
      validated: true
    }
  ];
}
