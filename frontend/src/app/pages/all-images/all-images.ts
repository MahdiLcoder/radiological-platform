import { Component, inject, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorklistTable, WorklistItem } from '../../components/worklist-table/worklist-table';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AnalysisService } from '../../services/analysisService';

import { FiltersSection, SelectFilterConfig, ActionButtonConfig } from '../../components/filters-section/filters-section';
import { WelcomeSection } from '../../components/welcome-section/welcome-section';

@Component({
  selector: 'app-all-images',
  standalone: true,
  imports: [WorklistTable, RouterModule, FormsModule, WelcomeSection, FiltersSection],
  templateUrl: './all-images.html',
  styleUrl: './all-images.css',
})
export class AllImages {
  private analysisService = inject(AnalysisService);

  tableColumns: string[] = ['Patient Details', 'Modality', 'Upload Date', 'AI Status', 'Actions'];

  filterSelects: SelectFilterConfig[] = [
    {
      key: 'modality',
      icon: 'radiology',
      placeholder: 'All Modalities',
      options: ['X-Ray', 'CT Scan', 'MRI']
    },
    {
      key: 'status',
      icon: 'analytics',
      placeholder: 'All Lifecycle',
      options: [
        { label: 'Queue: Pending', value: 'Pending' },
        { label: 'Pipeline: Analyzed', value: 'Analyzed' },
        { label: 'Session: Validated', value: 'Validated' }
      ]
    }
  ];

  filterActions: ActionButtonConfig[] = [
    { label: 'REFRESH', icon: 'sync', actionKey: 'refresh' }
  ];

  // Filters
  searchQuery = signal('');
  selectedModality = signal('');
  selectedStatus = signal('');
  currentPage = signal(1);

  imagesQuery = injectQuery(() => ({
    queryKey: ['all_images_full', this.searchQuery(), this.selectedModality(), this.selectedStatus(), this.currentPage()],
    queryFn: () => lastValueFrom(
      this.analysisService.getAllImages({
        search: this.searchQuery(),
        modality: this.selectedModality(),
        status: this.selectedStatus().toLowerCase(),
        page: this.currentPage(),
        page_size: 10
      })
    ),
  }));

  worklistData = computed<WorklistItem[]>(() => {
    const response: any = this.imagesQuery.data();
    if (!response || !response.results) return [];
    
    return response.results.map((img: any) => {
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
          id: p?.id || 'Unknown',
          isEmergency: false
        },
        modality: img.modality,
        uploadDate: {
          time: timeStr,
          date: dateStr
        },
        aiStatus,
        action: {
          type: actionType,
          text: actionText
        }
      };
    });
  });

  totalPages = computed(() => (this.imagesQuery.data() as any)?.total_pages || 1);
  totalItems = computed(() => (this.imagesQuery.data() as any)?.count || 0);

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  onFilterChange() {
    this.currentPage.set(1);
  }
}
