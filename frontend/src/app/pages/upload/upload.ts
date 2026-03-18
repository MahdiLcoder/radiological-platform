import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './upload.html',
  styleUrl: './upload.css',
})
export class Upload {
  patientId: string = '';
  modality: string = 'X-Ray';
  selectedFiles: File[] = [];

  onFileSelected(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      this.selectedFiles = Array.from(fileList);
      console.log('Selected files:', this.selectedFiles);
    }
  }

  canStartAnalysis(): boolean {
    return this.selectedFiles.length > 0 && this.patientId.trim().length > 0;
  }

  startAnalysis() {
    if (this.canStartAnalysis()) {
      console.log('Starting AI Analysis for:', {
        patientId: this.patientId,
        modality: this.modality,
        files: this.selectedFiles,
      });
      // Implementation for analysis trigger goes here
      alert('AI Analysis started for Patient ID: ' + this.patientId);
    }
  }
}
