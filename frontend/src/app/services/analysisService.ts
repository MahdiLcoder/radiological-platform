import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../types';
import { environment } from '../../environments/environment';

export interface AnalysisResult {
  id: string;
  image?: {
    id: string;
    patient?: {
      id: string;
      first_name: string;
      last_name: string;
    };
    modality: string;
    status: string;
    file_path?: string;
  };
  model_name: string;
  predictions: Record<string, number>;
  top_finding: string;
  confidence: number;
  analyzed_at: string;
}

export interface UploadResponse {
  id: string;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    uid?: string;
  } | null;
  modality: string;
  file_path: string;
  status: string;
  uploaded_at: string;
  uploaded_by?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AnalysisService {
  private http = inject(HttpClient);
  private imagesApiUrl = `${environment.apiUrl}/images`;
  private inferenceApiUrl = `${environment.apiUrl}/inference`;

  uploadImage(file: File, patientId: string, modality: string): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('patient', patientId);
    formData.append('modality', modality);

    return this.http.post<UploadResponse>(`${this.imagesApiUrl}/upload/`, formData);
  }

  getImageDetail(id: string): Observable<UploadResponse> {
    return this.http.get<UploadResponse>(`${this.imagesApiUrl}/${id}/`);
  }

  getAllImages(params: any = {}): Observable<PaginatedResponse<UploadResponse[]>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        httpParams = httpParams.append(key, params[key]);
      }
    });
    return this.http.get<PaginatedResponse<UploadResponse[]>>(`${this.imagesApiUrl}/`, {
      params: httpParams,
    });
  }

  runPrediction(imageId: string): Observable<AnalysisResult> {
    return this.http.post<AnalysisResult>(`${this.inferenceApiUrl}/${imageId}/run/`, {});
  }

  getPrediction(imageId: string): Observable<AnalysisResult> {
    return this.http.get<AnalysisResult>(`${this.inferenceApiUrl}/${imageId}/`);
  }

  createDiagnosis(data: {
    image: string;
    ai_prediction?: string;
    action: 'accepted' | 'modified' | 'rejected';
    final_finding?: string;
    clinical_notes?: string;
  }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/diagnosis/`, data);
  }
}
