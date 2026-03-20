import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ReportApiItem {
  id: string;
  image: {
    id: string;
    patient_name: string | null;
    patient: string | null;
    modality: string;
  } | null;
  diagnosis: {
    id: string;
    action: 'accepted' | 'modified' | 'rejected';
    final_finding: string;
    clinical_notes: string;
  } | null;
  generated_by: number;
  generated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000/api/reports';

  /** Generate (or return cached) report for a given diagnosis ID */
  generateReport(diagnosisId: string): Observable<ReportApiItem> {
    return this.http.post<ReportApiItem>(`${this.baseUrl}/generate/`, {
      diagnosis_id: diagnosisId,
    });
  }

  /** List all reports */
  getReports(): Observable<ReportApiItem[]> {
    return this.http.get<ReportApiItem[]>(`${this.baseUrl}/`);
  }

  /** Get a single report by ID */
  getReport(id: string): Observable<ReportApiItem> {
    return this.http.get<ReportApiItem>(`${this.baseUrl}/${id}/`);
  }

  /** Download PDF — triggers file save */
  downloadReport(id: string): void {
    this.http
      .get(`${this.baseUrl}/${id}/download/`, { responseType: 'blob' })
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }
}
