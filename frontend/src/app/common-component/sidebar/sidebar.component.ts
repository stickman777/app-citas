import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { ActiveCenterService } from '../../core/centers/active-center.service';
import { Center, CentersService } from '../../core/centers/centers.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { CommonService } from '../../shared/common/common.service';
import { DataService } from '../../shared/data/data.service';
import { MenuItem, SideBarData } from '../../shared/models/models';
import { routes } from '../../shared/routes/routes';
import { SideBarService } from '../../shared/sidebar/sidebar.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [CommonModule, RouterLink, NgScrollbarModule, TranslatePipe],
})
export class SidebarComponent {
  public base = '';
  public page = '';
  public last = '';
  public currentUrl = '';
  public sidebartop = false;
  public centers: Center[] = [];
  public activeCenter: Center | null = null;
  public routes = routes;
  public sidebarData: SideBarData[] = [];
  public isOpen = false;

  constructor(
    private data: DataService,
    private router: Router,
    public sideBar: SideBarService,
    public common: CommonService,
    private centersService: CentersService,
    private activeCenterService: ActiveCenterService
  ) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.getRoutes(event);
      }
    });

    this.data.getSideBarData.subscribe((res: SideBarData[]) => {
      this.sidebarData = res;
    });
    this.activeCenterService.activeCenter$.subscribe(center => {
      this.activeCenter = center;
    });
    this.centersService.centersChanged$.subscribe(() => this.loadCenters());
    this.sideBar.toggleMobileSideBar.subscribe(state => {
      if (state !== 'true') this.sidebartop = false;
    });
    this.getRoutes(this.router);
  }

  public ngOnInit(): void {
    this.expandSubMenusActive();
    this.loadCenters();
  }

  public togglesidebartop(): void {
    this.sidebartop = !this.sidebartop;
  }

  public toggleSidebar(): void {
    this.sidebartop = false;

    const wrapper = document.getElementsByClassName('main-wrapper')[0];
    const overlay = document.getElementsByClassName('sidebar-overlay')[0];

    wrapper?.classList.remove('slide-nav');
    overlay?.classList.remove('opened');
    document.body.style.overflow = '';
  }

  public expandSubMenus(menu: MenuItem): void {
    sessionStorage.setItem('menuValue', menu.menuValue);
    this.sidebarData.forEach((mainMenu: SideBarData) => {
      mainMenu.menu.forEach((resMenu: MenuItem) => {
        resMenu.showSubRoute = resMenu.menuValue === menu.menuValue ? !resMenu.showSubRoute : false;
      });
    });
  }

  public expandSubMenusActive(): void {
    const activeMenu = sessionStorage.getItem('menuValue');

    this.sidebarData.forEach((mainMenu: SideBarData) => {
      mainMenu.menu.forEach((resMenu: MenuItem) => {
        resMenu.showSubRoute = activeMenu ? resMenu.menuValue === activeMenu : resMenu.base === 'index';
      });
    });

    this.isOpen = !activeMenu;
  }

  public miniSideBarMouseHover(position: string): void {
    this.sideBar.expandSideBar.next(position === 'over' ? 'true' : 'false');
  }

  public selectCenter(center: Center): void {
    this.activeCenterService.setActiveCenter(center);
    this.sidebartop = false;
  }

  public centerLogo(center: Center | null): string | null {
    return center?.logoUrl?.trim() || null;
  }

  public centerCity(center: Center | null): string {
    return center?.city || '';
  }

  private getRoutes(route: { url: string; urlAfterRedirects?: string }): void {
    this.sidebartop = false;
    document.body.classList.remove('slide-nav', 'opened');
    document.body.style.overflow = '';

    const url = this.normalizeRouteUrl(route.urlAfterRedirects ?? route.url);
    const splitVal = url.split('/');

    this.currentUrl = url;
    this.base = splitVal[1] || '';
    this.page = this.base === 'index' ? 'index' : splitVal[2] || '';
    this.last = splitVal[3] || '';
  }

  private normalizeRouteUrl(url: string): string {
    return url.split(/[?#]/)[0] || '/';
  }

  private loadCenters(): void {
    this.centersService.getCenters().subscribe({
      next: centers => {
        this.centers = centers;
        this.activeCenterService.setAvailableCenters(centers);
      },
    });
  }
}
