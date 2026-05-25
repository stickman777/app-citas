import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { DataService } from '../../shared/data/data.service';
import { MenuItem, SideBarData } from '../../shared/models/models';
import { routes } from '../../shared/routes/routes';
import { SettingsService } from '../../shared/settings/settings.service';
import { SideBarService } from '../../shared/sidebar/sidebar.service';
import { MatSelectModule } from '@angular/material/select';
import { NgScrollbarModule } from 'ngx-scrollbar';
interface url{
  url:string
}

@Component({
  selector: 'app-patient-sidebar',
  templateUrl: './patient-sidebar.component.html',
  styleUrl: './patient-sidebar.component.scss',
    imports: [CommonModule,RouterLink,MatSelectModule,NgScrollbarModule]
})
export class PatientSidebarComponent {
url: string;
  base = '';
  page = '';
  last = '';
  currentUrl = '';
  sidebartop = false;
  sidebarfooter=false;
   openSubmenuOneItem: any = null;
  togglesidebartop():void{
    this.sidebartop=!this.sidebartop
  }
  public toggleSidebarmini(): void {
    this.sideBar.switchSideMenuPosition();
  }
  footerClose(){
    this.sidebarfooter=true;
  }
  public multilevel: Array<boolean> = [false, false, false];

  public routes = routes;
  public sidebarData: Array<SideBarData> = [];

  constructor(
    private data: DataService,
    private router: Router,
    private sideBar: SideBarService,
    public settings:SettingsService
  ) {
this.url = this.router.url;
        router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.getRoutes(event);
      }
    });
    this.getRoutes(this.router);
    this.getRoutes(this.router);
          this.data.getSideBar3Data.subscribe((res:SideBarData[]) => {
        this.sidebarData = res;
    });
  }

  public expandSubMenus(menu: MenuItem): void {
    sessionStorage.setItem('menuValue', menu.menuValue);
    this.sidebarData.map((mainMenus: SideBarData) => {
      mainMenus.menu.map((resMenu: MenuItem) => {
        if (resMenu.menuValue == menu.menuValue) {
          menu.showSubRoute = !menu.showSubRoute;
        } else {
          resMenu.showSubRoute = false;
        }
      });
    });
  }
  
    private getRoutes(route: url): void {
    const splitVal = route.url.split('/');
    this.currentUrl = route.url;
    this.base = splitVal[1];
    this.page = splitVal[2];
    this.last = splitVal[3];
  }
  public toggleSidebar(): void {
  const wrapper = document.getElementsByClassName('main-wrapper')[0];
  const overlay = document.getElementsByClassName('sidebar-overlay')[0];

  if (wrapper) {
    wrapper.classList.remove('slide-nav');
  }

  if (overlay) {
    overlay.classList.remove('opened');
  }
}
  public miniSideBarMouseHover(position: string): void {
    if (position == 'over') {
      this.sideBar.expandSideBar.next("true");
    } else {
      this.sideBar.expandSideBar.next("false");
    }
  }
    isOpen=false;
    public expandSubMenusActive(): void {
      const activeMenu = sessionStorage.getItem('menuValue'); // Was 'base' — changed to 'menuValue'
    
      if (!Array.isArray(this.sidebarData)) {
        console.warn('side_bar_data is not initialized');
        return;
      }
    
      this.sidebarData.forEach((mainMenu: SideBarData) => {
        if (!Array.isArray(mainMenu.menu)) return;
    
        mainMenu.menu.forEach((resMenu: MenuItem) => {
          if (activeMenu) {
            // Show only the menu matching the stored menuValue
            resMenu.showSubRoute = (resMenu.menuValue === activeMenu);
          } else {
            // No session value: Show only 'index' base routes
            resMenu.showSubRoute = (resMenu.base === 'dashboard');
          }
        });
      });
    
      this.isOpen = !activeMenu;
    }
  openSubmenuOne(subMenus: any): void {
    if (this.openSubmenuOneItem === subMenus) {
      this.openSubmenuOneItem = null;
    } else {
      this.openSubmenuOneItem = subMenus;
    }
  }
  dataLayoutHidden = false;

ngOnInit(): void {
  const html = document.documentElement;
  const dataLayout = html.getAttribute('data-layout');
  this.dataLayoutHidden = dataLayout === 'hidden';
  this.expandSubMenusActive()
}
}
