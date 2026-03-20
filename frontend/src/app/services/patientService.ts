import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
  private apiUrl: string = 'http://localhost:8000/api/patients';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/`);
  }

  getById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}/`);
  }

  create(patientData: Patient): Observable<Patient> {
    return this.http.post<Patient>(`${this.apiUrl}/`, patientData);
  }

  update(id: string, patientData: Partial<Patient>): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}/`, patientData);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}/`);
  }
}
