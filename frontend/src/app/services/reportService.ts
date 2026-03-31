import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../types';
import { environment } from '../../environments/environment';

export interface ReportApiItem {
  id: string;
  doctor: string;
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
  private baseUrl = `${environment.apiUrl}/reports`;

  generateReport(diagnosisId: string): Observable<ReportApiItem> {
    return this.http.post<ReportApiItem>(`${this.baseUrl}/generate/`, {
      diagnosis_id: diagnosisId,
    });
  }

  getReports(params: any = {}): Observable<PaginatedResponse<ReportApiItem[]>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        httpParams = httpParams.append(key, params[key]);
      }
    });
    return this.http.get<PaginatedResponse<ReportApiItem[]>>(`${this.baseUrl}/`, { params: httpParams });
  }

  getReport(id: string): Observable<ReportApiItem> {
    return this.http.get<ReportApiItem>(`${this.baseUrl}/${id}/`);
  }

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

  getReportByImageId(imageId: string): Observable<ReportApiItem> {
    return this.http.get<ReportApiItem>(`${this.baseUrl}/by-image/${imageId}/`);
  }

  downloadReportByImageId(imageId: string): void {
    this.getReportByImageId(imageId).subscribe({
      next: (report) => this.downloadReport(report.id),
      error: (err) => console.error('No report found for this image:', err),
    });
  }
}
