import { Component, inject, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorklistTable, WorklistItem } from '../../components/worklist-table/worklist-table';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AnalysisService } from '../../services/analysisService';

@Component({
  selector: 'app-all-images',
  standalone: true,
  imports: [WorklistTable, RouterModule, FormsModule],
  templateUrl: './all-images.html',
  styleUrl: './all-images.css',
})
export class AllImages {
  private analysisService = inject(AnalysisService);

  tableColumns: string[] = ['Patient Details', 'Modality', 'Upload Date', 'AI Status', 'Actions'];

  // Filters
  searchQuery = signal('');
  selectedModality = signal('');
  selectedStatus = signal('');

  imagesQuery = injectQuery(() => ({
    queryKey: ['all_images_full'],
    queryFn: () => lastValueFrom(this.analysisService.getAllImages()).then(data => Array.isArray(data) ? data : []),
  }));

  worklistData = computed<WorklistItem[]>(() => {
    const images = this.imagesQuery.data() || [];
    const mapped: WorklistItem[] = images.map(img => {
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

    const q = this.searchQuery().toLowerCase();
    const mod = this.selectedModality();
    const stat = this.selectedStatus();

    return mapped.filter(item => {
      const matchesSearch = 
        !q || 
        item.patient.name.toLowerCase().includes(q) || 
        item.patient.id.toLowerCase().includes(q) ||
        item.modality.toLowerCase().includes(q);

      const matchesModality = !mod || item.modality === mod;
      const matchesStatus = !stat || item.aiStatus === stat;

      return matchesSearch && matchesModality && matchesStatus;
    }).sort((a, b) => new Date(b.uploadDate.date + ' ' + b.uploadDate.time).getTime() - new Date(a.uploadDate.date + ' ' + a.uploadDate.time).getTime());
  });
}
