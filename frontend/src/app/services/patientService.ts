import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../types';
import { environment } from '../../environments/environment';

export interface Patient {
  id?: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  last_visit?: string;
  doctor?: {
    id: number;
    email: string;
    username: string;
  };
  stats?: {
    total_scans: number;
    active_diagnoses: number;
  };
  recent_scans?: any[];
  active_diagnoses_list?: any[];
  created_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private apiUrl: string = `${environment.apiUrl}/patients`;
  private http = inject(HttpClient);

  getAll(params: any = {}): Observable<PaginatedResponse<Patient[]>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        httpParams = httpParams.append(key, params[key]);
      }
    });
    return this.http.get<PaginatedResponse<Patient[]>>(`${this.apiUrl}/`, { params: httpParams });
  }

  getById(id: string, scanOrder: 'desc' | 'asc' = 'desc'): Observable<Patient> {
    const params = new HttpParams().set('scan_order', scanOrder);
    return this.http.get<Patient>(`${this.apiUrl}/${id}/`, { params });
  }

  create(patientData: Patient): Observable<Patient> {
    return this.http.post<Patient>(`${this.apiUrl}/`, patientData);
  }

  update(id: string, patientData: Partial<Patient>): Observable<Patient> {
    return this.http.patch<Patient>(`${this.apiUrl}/${id}/`, patientData);
  }
}
