import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.css'
})
export class PatientDetail {
  constructor() {}
}
