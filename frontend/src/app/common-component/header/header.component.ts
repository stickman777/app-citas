import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { routes } from '../../shared/routes/routes';
import { SettingsService } from '../../shared/settings/settings.service';
import { SideBarService } from '../../shared/sidebar/sidebar.service';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { CommonService } from '../../shared/common/common.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    imports: [CommonModule,RouterLink,MatSelectModule,NgScrollbarModule]
})
export class HeaderComponent {
  public routes = routes;
  public openBox = false;
  public miniSidebar  = false;
  public addClass = false;
 base = '';
 themeColor: 'light' | 'dark' = 'light';
  mobileSidebar=false;
  constructor(public router: Router,public sideBar: SideBarService,public settings:SettingsService,public common:CommonService) {
    this.common.baseRoute
    this.sideBar.toggleSideBar.subscribe((res: string) => {
      if (res == 'true') {
        this.miniSidebar = true;
      } else {
        this.miniSidebar = false;
      }
    });
    this.getRoutes(this.router);
  }
  private getRoutes(route: { url: string }): void {

    const splitVal = route.url.split('/');
    this.base = splitVal[1] || '';

  }
  openBoxFunc() {
    this.openBox = !this.openBox;
    /* eslint no-var: off */
    var mainWrapper = document.getElementsByClassName('main-wrapper')[0];
    if (this.openBox) {
      mainWrapper.classList.add('open-msg-box');
    } else {
      mainWrapper.classList.remove('open-msg-box');
    }
  }
  public toggleMobileIcon(): void {
    this.sideBar.switchMobileSideBarPosition();
    this.mobileSidebar=!this.mobileSidebar;
  }
  public toggleSideBar(): void {
    this.sideBar.switchSideMenuPosition();
  }
  public toggleMobileSideBar(): void {
    this.sideBar.switchMobileSideBarPosition();
    
      this.addClass = !this.addClass;
      /* eslint no-var: off */
      var root = document.getElementsByTagName( 'html' )[0];
      /* eslint no-var: off */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      var sidebar:any = document.getElementById('sidebar')
  
      if (this.addClass) {
        root.classList.add('menu-opened');
        sidebar.classList.add('opened');
        // check if the html element has the class
       
      }
      else {
        root.classList.remove('menu-opened');
        sidebar.classList.remove('opened');
        
      }
    }
    ngOnInit(): void {
    const savedTheme = localStorage.getItem('themeColor') as 'light' | 'dark' | null;
    this.themeColor = savedTheme || 'light';
    this.sideBar.changeThemeColor(this.themeColor);
  }

  toggleTheme(): void {
    this.themeColor = this.themeColor === 'dark' ? 'light' : 'dark';
    localStorage.setItem('themeColor', this.themeColor);
    this.sideBar.changeThemeColor(this.themeColor);
  }

  }
