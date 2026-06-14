import { Routes } from '@angular/router';
import {
  adminAreaChildGuard,
  adminAreaGuard,
  authChildGuard,
  authGuard,
  clientAreaChildGuard,
  clientAreaGuard,
} from './core/auth/auth.guard';

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
      {
        path: 'register-client',
        loadComponent: () => import('./auth/register-client/register-client.component').then(m => m.RegisterClientComponent),
      },
    ],
  },
  {
    path: 'client',
    loadComponent: () => import('./features/client-portal/client-layout/client-layout.component').then(m => m.ClientLayoutComponent),
    canActivate: [authGuard, clientAreaGuard],
    canActivateChild: [authChildGuard, clientAreaChildGuard],
    children: [
      {
        path: '',
        redirectTo: 'appointments',
        pathMatch: 'full',
      },
      {
        path: 'appointments',
        loadComponent: () => import('./features/client-portal/client-appointments/client-appointments.component').then(m => m.ClientAppointmentsComponent),
      },
      {
        path: 'book',
        loadComponent: () => import('./features/client-portal/client-book/client-book.component').then(m => m.ClientBookComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/client-portal/client-profile/client-profile.component').then(m => m.ClientProfileComponent),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('./features/features.component').then(m => m.FeaturesComponent),
    canActivate: [authGuard, adminAreaGuard],
    canActivateChild: [authChildGuard, adminAreaChildGuard],
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
        path: 'appointment-requests',
        loadComponent: () => import('./features/clinic/appointment-requests/appointment-requests.component').then(m => m.AppointmentRequestsComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/administration/users/users.component').then(m => m.UsersComponent),
      },
      {
        path: 'my-account',
        loadComponent: () => import('./features/account/my-account/my-account.component').then(m => m.MyAccountComponent),
      },
      {
        path: 'patient',
        children: [
          {
            path: 'patient-list',
            redirectTo: '/clients',
            pathMatch: 'full',
          },
          {
            path: '',
            redirectTo: '/clients',
            pathMatch: 'full',
          },
        ],
      },
    ],
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
