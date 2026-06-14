import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { MenuItem, SideBarData } from '../models/models';
import { routes } from '../routes/routes';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  public readonly sideBar: SideBarData[] = [
    {
      tittle: '',
      showAsTab: false,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Dashboard',
          labelKey: 'sidebar.dashboard',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.index,
          base: 'index',
          icon: 'layout-dashboard',
          subMenus: [],
        },
        {
          menuValue: 'Citas',
          labelKey: 'sidebar.appointments',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.appointment,
          base: 'appointment',
          icon: 'calendar',
          subMenus: [],
        },
        {
          menuValue: 'Solicitudes',
          labelKey: 'sidebar.appointmentRequests',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.appointmentRequests,
          base: 'appointment-requests',
          icon: 'clipboard-list',
          subMenus: [],
        },
        {
          menuValue: 'Servicios',
          labelKey: 'sidebar.services',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.services,
          base: 'services',
          icon: 'stethoscope',
          subMenus: [],
        },
        {
          menuValue: 'Especialistas',
          labelKey: 'sidebar.specialists',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.specialists,
          base: 'specialists',
          icon: 'user-star',
          subMenus: [],
        },
        {
          menuValue: 'Clientes',
          labelKey: 'sidebar.clients',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.clients,
          base: 'clients',
          icon: 'users',
          subMenus: [],
        },
        {
          menuValue: 'Usuarios',
          labelKey: 'sidebar.users',
          hasSubRoute: false,
          showSubRoute: false,
          route: routes.users,
          base: 'users',
          icon: 'user-cog',
          subMenus: [],
        },
      ],
    },
  ];

  public readonly getSideBarData = new BehaviorSubject<SideBarData[]>(
    this.sideBar,
  );

  public resetData(): void {
    this.sideBar.forEach((section: SideBarData) => {
      section.showAsTab = false;
      section.menu.forEach((menu: MenuItem) => {
        menu.showSubRoute = false;
      });
    });
  }
}
