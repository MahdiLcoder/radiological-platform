import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface AnalysisResult {
  id: string;
  image: {
    id: string;
    patient?: {
      id: string;
      first_name: string;
      last_name: string;
    };
    modality: string;
  };
  model_name: string;
  predictions: Record<string, number>;
  top_finding: string;
  confidence: number;
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
  private imagesApiUrl = 'http://localhost:8000/api/images';
  private inferenceApiUrl = 'http://localhost:8000/api/inference';

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
    return this.http.post<any>(`http://localhost:8000/api/diagnosis/`, data);
  }
}
