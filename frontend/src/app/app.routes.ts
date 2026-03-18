import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
    {
        path: 'dashboard',
        loadComponent: () => import('./layout/layout').then(m => m.Layout),
        children: [
            { path: 'radiologist', loadComponent: () => import('./pages/radiologist/radiologist').then(m => m.Radiologist) }
        ]
    }
];
