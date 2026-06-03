import { Component, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, NavigationStart, Router , Event as RouterEvent, RouterModule} from '@angular/router';
import { DataService } from '../shared/data/data.service';
import { SideBarService } from '../shared/sidebar/sidebar.service';
import { MenuItem, SideBarData } from '../shared/models/models';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonService } from '../shared/common/common.service';
import { filter } from 'rxjs';
import { SettingsService } from '../shared/settings/settings.service';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../common-component/sidebar/sidebar.component';
import { HeaderComponent } from '../common-component/header/header.component';
  interface Route {
  url: string;
  // Add other properties if necessary
}
export interface RouterObject {
  id?: number;
  url: string;
  type?: number;
}

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
})
export class FeaturesComponent {
  public miniSidebar = 'false';
  public expandMenu = 'false';
  public mobileSidebar = 'false';
  public sideBarActivePath = false;
  public headerActivePath = false;
  base = '';
  page = '';
  last = '';
  currentUrl = '';
layoutMode = '';
  constructor(
    private sideBar: SideBarService,
    public router: Router,
    private data: DataService,
    private breakpointObserver:BreakpointObserver,
    private common:CommonService,
    private settings:SettingsService
  ) 
  {
    this.router.events.pipe(
  filter(event => event instanceof NavigationEnd)
).subscribe(() => {
  this.getRoutes(this.router);
});
    this.getRoutes(this.router);

    this.common.baseRoute.subscribe((res: string) => {
      this.base = res
    });
    this.common.pageRoute.subscribe((res: string) => {
      this.page = res
    });
    this.common.lastRoute.subscribe((res: string) => {
      this.last = res
    });

    this.sideBar.toggleSideBar.subscribe((res: string) => {
      if (res == 'true') {
        this.miniSidebar = 'true';
      } else {
        this.miniSidebar = 'false';
      }
    });
this.router.events.subscribe((data: RouterEvent) => {
      if (data instanceof NavigationStart) {
        this.getRoutes(data);
      }
      if (data instanceof NavigationEnd) {
        localStorage.removeItem('isMobileSidebar');
        this.mobileSidebar = 'false';
        if (document.querySelectorAll('main-wrapper')) {
          document.body.style.overflow = '';
        }
      }
    });
    this.sideBar.toggleMobileSideBar.subscribe((res: string) => {
      if (res == 'true' || res == 'true') {
        this.mobileSidebar = 'true';
         if (document.querySelectorAll('main-wrapper slide-nav')) {
          document.body.style.overflow = 'hidden';
        }

      } else {
        this.mobileSidebar = 'false';
        if (document.querySelectorAll('main-wrapper')) {
          document.body.style.overflow = '';
        }
      }
    });
    this.settings.layoutMode.subscribe((layout) => {
      this.layoutMode = layout;
      if (layout == 'mini') {
        this.miniSidebar = 'true';
      } else {
        this.miniSidebar = 'false';
      }
    });
    this.sideBar.expandSideBar.subscribe((res: string) => {
      this.expandMenu = res;
      if (res == 'false' && this.miniSidebar == 'true') {
        this.data.sideBar.map((mainMenus: SideBarData) => {
          mainMenus.menu.map((resMenu: MenuItem) => {
            resMenu.showSubRoute = false;
          });
        });
      }
      if (res == 'true' && this.miniSidebar == 'true') {
        this.data.sideBar.map((mainMenus: SideBarData) => {
          mainMenus.menu.map((resMenu: MenuItem) => {
            const menuValue = sessionStorage.getItem('menuValue');
            if (menuValue && menuValue == resMenu.menuValue) {
              resMenu.showSubRoute = true;
            } else {
              resMenu.showSubRoute = false;
            }
          });
        });
      }
    });

       
  }
  public toggleMobileSideBar(): void {
    this.sideBar.switchMobileSideBarPosition();
  }

ngOnInit():void{
  this.breakpointObserver.observe(['(min-width: 991.98px)'])
  .subscribe((result: { matches: any; }) => {
    if (result.matches) {
      this.mobileSidebar = 'false';
    } 
  });   
}

  private getRoutes(route: RouterObject): void {
    const splitVal =  route?.url.split('/');
    this.common.currentRoute.next(route.url);
    this.common.baseRoute.next(splitVal[1]);
    this.common.pageRoute.next(splitVal[2]);
    this.common.lastRoute.next(splitVal[3]);
  } 
}
