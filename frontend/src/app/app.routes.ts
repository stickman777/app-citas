import { Routes } from '@angular/router';
import { authChildGuard, authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./features/features.component').then(m => m.FeaturesComponent),
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    children: [
      {
        path: 'index',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clinic/patient/patient-list/patient-list.component').then(m => m.PatientListComponent),
      },
      {
        path: 'centers/:id/edit',
        loadComponent: () => import('./features/administration/centers/center-edit/center-edit.component').then(m => m.CenterEditComponent),
      },
      {
        path: 'centers',
        loadComponent: () => import('./features/administration/centers/centers.component').then(m => m.CentersComponent),
      },
      {
        path: 'services',
        loadComponent: () => import('./features/clinic/services/services.component').then(m => m.ServicesComponent),
      },
      {
        path: 'specialists',
        loadComponent: () => import('./features/clinic/specialists/specialists.component').then(m => m.SpecialistsComponent),
      },
      {
        path: 'appointment/appointment-list',
        redirectTo: 'appointment',
        pathMatch: 'full',
      },
      {
        path: 'appointment/new-appointment',
        redirectTo: 'appointment',
        pathMatch: 'full',
      },
      {
        path: 'appointment',
        loadComponent: () => import('./features/clinic/appointment/appointment.component').then(m => m.AppointmentComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/administration/users/users.component').then(m => m.UsersComponent),
      },
      {
        path: 'patient',
        loadComponent: () => import('./features/clinic/patient/patient.component').then(m => m.PatientComponent),
        children: [
          {
            path: 'patient-list',
            loadComponent: () => import('./features/clinic/patient/patient-list/patient-list.component').then(m => m.PatientListComponent),
          },
        ],
      },
      {
        path: 'layout-default',
        loadComponent: () => import('./features/modal-dashboard/modal-dashboard.component').then(m => m.ModalDashboardComponent),
      },
      {
        path: 'layout-mini',
        loadComponent: () => import('./features/modal-dashboard/modal-dashboard.component').then(m => m.ModalDashboardComponent),
      },
      {
        path: 'layout-hover-view',
        loadComponent: () => import('./features/modal-dashboard/modal-dashboard.component').then(m => m.ModalDashboardComponent),
      },
      {
        path: 'layout-hidden',
        loadComponent: () => import('./features/modal-dashboard/modal-dashboard.component').then(m => m.ModalDashboardComponent),
      },
      {
        path: 'layout-full-width',
        loadComponent: () => import('./features/modal-dashboard/modal-dashboard.component').then(m => m.ModalDashboardComponent),
      },
      {
        path: 'layout-rtl',
        loadComponent: () => import('./features/modal-dashboard/modal-dashboard.component').then(m => m.ModalDashboardComponent),
      },
      {
        path: 'layout-dark',
        loadComponent: () => import('./features/modal-dashboard/modal-dashboard.component').then(m => m.ModalDashboardComponent),
      },
    ],
  },
  {
    path: 'coming-soon',
    loadComponent: () => import('./features/pages/coming-soon/coming-soon.component').then(m => m.ComingSoonComponent),
  },
  {
    path: 'under-maintenance',
    loadComponent: () => import('./features/pages/under-maintenance/under-maintenance.component').then(m => m.UnderMaintenanceComponent),
  },
  {
    path: 'error',
    loadComponent: () => import('./error/error.component').then(m => m.ErrorComponent),
    children: [
      {
        path: 'error404',
        loadComponent: () => import('./error/error404/error404.component').then(m => m.Error404Component),
      },
      {
        path: 'error500',
        loadComponent: () => import('./error/error500/error500.component').then(m => m.Error500Component),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'error/error404',
    pathMatch: 'full',
  },
] as const;
