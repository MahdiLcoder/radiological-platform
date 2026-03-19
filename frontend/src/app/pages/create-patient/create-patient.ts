import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-create-patient',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './create-patient.html',
  styleUrl: './create-patient.css',
})
export class CreatePatient {}
