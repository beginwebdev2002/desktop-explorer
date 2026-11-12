import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./drives/drives.component').then((m) => m.DrivesComponent),
    pathMatch: 'full',
  },
];
