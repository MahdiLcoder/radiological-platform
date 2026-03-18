import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
  {
    path: 'dashboard',
    loadComponent: () => import('./layout/layout').then((m) => m.Layout),
    children: [
      {
        path: 'radiologist',
        loadComponent: () => import('./pages/radiologist/radiologist').then((m) => m.Radiologist),
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
      // { path: 'patients', loadComponent: () => import('./pages/patients/patients').then(m => m.Patients) },
      // { path: 'analytics', loadComponent: () => import('./pages/analytics/analytics').then(m => m.Analytics) }
    ],
  },
];
