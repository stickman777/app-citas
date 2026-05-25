import { Component } from '@angular/core';
import { NavigationEnd, Router , RouterLink } from '@angular/router';
import { DataService } from '../../shared/data/data.service';
import { MenuItem, SideBarData } from '../../shared/models/models';
import { routes } from '../../shared/routes/routes';
import { SettingsService } from '../../shared/settings/settings.service';
import { SideBarService } from '../../shared/sidebar/sidebar.service';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { CommonService } from '../../shared/common/common.service';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    imports: [CommonModule,RouterLink,MatSelectModule,NgScrollbarModule]
})
export class SidebarComponent {
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
  layoutHidden=false;

  constructor(
    private data: DataService,
    private router: Router,
    public sideBar: SideBarService,
    public settings:SettingsService,
    public common:CommonService
  ) {
        router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.getRoutes(event);
      }
    });
 

      this.data.getSideBarData.subscribe((res:SideBarData[]) => {
        this.sidebarData = res;
    });
    this.getRoutes(this.router);
  }
public toggleSidebar(): void {
  const wrapper = document.getElementsByClassName('main-wrapper')[0];
  const overlay = document.getElementsByClassName('sidebar-overlay')[0];

  if (wrapper) {
    wrapper.classList.remove('slide-nav');
    if (document.querySelectorAll('main-wrapper')) {
          document.body.style.overflow = '';
        }
  }

  if (overlay) {
    overlay.classList.remove('opened');
    if (document.querySelectorAll('main-wrapper')) {
          document.body.style.overflow = '';
        }
  }
}
public expandSubMenus(menu: { menuValue: string; showSubRoute: boolean; }): void {
    
    sessionStorage.setItem('menuValue', menu.menuValue);
    this.sidebarData.map((mainMenus: SideBarData) => {

      mainMenus.menu.map((resMenu: MenuItem) => {
        // collapse other submenus which are open
        if (resMenu.menuValue == menu.menuValue) {
          menu.showSubRoute = !menu.showSubRoute;
        } else {
          resMenu.showSubRoute = false;
        }
      });
    });
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
          resMenu.showSubRoute = (resMenu.base === 'index');
        }
      });
    });
  
    this.isOpen = !activeMenu;
  }
  private getRoutes(route: { url: string }): void {
    const bodyTag = document.body;

    bodyTag.classList.remove('slide-nav')
    if (document.querySelectorAll('main-wrapper')) {
          document.body.style.overflow = '';
        }
    bodyTag.classList.remove('opened')
    this.currentUrl = route.url;

    const splitVal = route.url.split('/');


 this.base = splitVal[1] || '';
this.page = splitVal[2] || '';
this.last = splitVal[3] || '';

if (this.page.includes('-settings')) {
  this.base = splitVal[2] || '';
  this.page = splitVal[3] || '';
  this.last = splitVal[3] || '';
}
if(this.base==='index'){
  this.page= 'index';
}
if(this.base=='layout-default' || this.base=='layout-mini'|| this.base=='layout-hover-view' || this.base=='layout-hidden' || this.base=='layout-full-width' || this.base=='layout-rtl' || this.base=='layout-dark'){
  this.page=this.base

}
  }
  public miniSideBarMouseHover(position: string): void {
    if (position == 'over') {
      this.sideBar.expandSideBar.next("true");
    } else {
      this.sideBar.expandSideBar.next("false");
    }
  }
  openSubmenuOne(subMenus: any): void {
    if (this.openSubmenuOneItem === subMenus) {
      this.openSubmenuOneItem = null;
    } else {
      this.openSubmenuOneItem = subMenus;
    }
  }
  multiLevel1 = false;
  multiLevel2 = false;
  multiLevel3 = false;
  multiLevelOne() {
    this.multiLevel1 = !this.multiLevel1;
  }
  multiLevelTwo() {
    this.multiLevel2 = !this.multiLevel2;
  }
  multiLevelThree() {
    this.multiLevel3 = !this.multiLevel3;
    this.multiLevel2=true;
  }
dataLayoutHidden = false;

ngOnInit(): void {
  const html = document.documentElement;
  const dataLayout = html.getAttribute('data-layout');
  this.dataLayoutHidden = dataLayout === 'hidden';

  this.expandSubMenusActive();

}

}
