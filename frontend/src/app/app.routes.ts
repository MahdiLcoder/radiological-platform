import { Routes } from '@angular/router';

export const routes: Routes = [
    {path: '', loadComponent: () => import('./login/login').then(m => m.Login)},
];
