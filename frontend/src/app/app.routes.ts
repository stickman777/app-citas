import { Routes } from '@angular/router';

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
        path: 'services',
        loadComponent: () => import('./features/clinic/services/services.component').then(m => m.ServicesComponent),
      },
      {
        path: 'availability',
        loadComponent: () => import('./features/clinic/appointment/appointment-calendar/appointment-calendar.component').then(m => m.AppointmentCalendarComponent),
      },
      {
        path: 'appointment',
        loadComponent: () => import('./features/clinic/appointment/appointment.component').then(m => m.AppointmentComponent),
        children: [
          {
            path: 'appointment-list',
            loadComponent: () => import('./features/clinic/appointment/appointment-list/appointment-list.component').then(m => m.AppointmentListComponent),
          },
          {
            path: 'new-appointment',
            loadComponent: () => import('./features/clinic/appointment/new-appointment/new-appointment.component').then(m => m.NewAppointmentComponent),
          },
          {
            path: 'appointment-calendar',
            loadComponent: () => import('./features/clinic/appointment/appointment-calendar/appointment-calendar.component').then(m => m.AppointmentCalendarComponent),
          },
        ],
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
