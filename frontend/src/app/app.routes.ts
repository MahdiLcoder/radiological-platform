import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout').then((m) => m.Layout),
    children: [
      {
        path: 'radiologist',
        loadComponent: () => import('./pages/radiologist/radiologist').then((m) => m.Radiologist),
      },
      {
        path: 'doctor',
        loadComponent: () => import('./pages/doctor/doctor').then((m) => m.Doctor),
      },
      {
        path: 'all-images',
        loadComponent: () => import('./pages/all-images/all-images').then((m) => m.AllImages),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'upload',
        loadComponent: () => import('./pages/upload/upload').then((m) => m.Upload),
      },
      {
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin),
      },
      {
        path: 'admin/invite',
        loadComponent: () => import('./pages/admin-invite/admin-invite').then((m) => m.AdminInvite),
      },

      {
        path: 'aivalidation/:id',
        loadComponent: () => import('./pages/aivalidation/aivalidation').then((m) => m.Aivalidation),
      },
      {
        path: 'patients',
        loadComponent: () => import('./pages/patients/patients').then((m) => m.Patients),
      },
      {
        path: 'analytics',
        loadComponent: () => import('./pages/analytics/analytics').then((m) => m.Analytics),
      },
      {
        path: 'create-patient',
        loadComponent: () => import('./pages/create-patient/create-patient').then((m) => m.CreatePatient),
      },
      {
        path: 'patient-detail/:id',
        loadComponent: () => import('./pages/patient-detail/patient-detail').then((m) => m.PatientDetail),
      },
      {
        path: 'edit-patient/:id',
        loadComponent: () => import('./pages/create-patient/create-patient').then((m) => m.CreatePatient),
      },
      {
        path: 'all-findings',
        loadComponent: () => import('./pages/all-finding/all-finding').then((m) => m.AllFinding),
      },
      {
        path: 'edit-profile',
        loadComponent: () => import('./pages/edit-profile/edit-profile').then((m) => m.EditProfile),
      },
    ],
  },
];
