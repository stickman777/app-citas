import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService } from '../data/data.service';
import { CommonService } from '../common/common.service';
interface MainMenu {
  menu: MenuItem[];
}

interface MenuItem {
  menuValue: string;
  showSubRoute: boolean;  
}
@Injectable({
  providedIn: 'root',
})
export class SideBarService {
  private renderer: Renderer2;
  public toggleSideBar: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('isMiniSidebar') || "false"
  );
  public sideBarPosition: BehaviorSubject<string> = new BehaviorSubject<string>(
  localStorage.getItem('sideBarPosition') || 'false'
);

  public layoutPosition: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('layoutPosition') || '1'
  );
  public toggleMobileSideBar: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('isMobileSidebar') || "false"
  );

  public expandSideBar: BehaviorSubject<string> = new BehaviorSubject<string>("false");

    public themeColors: BehaviorSubject<string> = new BehaviorSubject<string>(
    localStorage.getItem('themeColor') || 'light'
  );


  constructor(private data: DataService,rendererFactory: RendererFactory2,private common: CommonService) {
    this.renderer = rendererFactory.createRenderer(null, null);
    if (localStorage.getItem('isMiniSidebar') == 'true') {
      this.expandSideBar.next("false");
    } else {
      this.expandSideBar.next("true");
    }
  }


  public switchSideMenuPosition(): void {
    if (localStorage.getItem('isMiniSidebar')) {
      this.toggleSideBar.next("false");
      localStorage.removeItem('isMiniSidebar');
      this.data.sideBar.map((mainMenus: MainMenu) => {
        mainMenus.menu.map((resMenu: MenuItem) => {
          const menuValue = sessionStorage.getItem('menuValue');
          if (menuValue && menuValue == resMenu.menuValue) {
            resMenu.showSubRoute = true;
          }
        });
      });
    } else {
      this.toggleSideBar.next('true');
      localStorage.setItem('isMiniSidebar', 'true');
      this.data.sideBar.map((mainMenus: MainMenu) => {
        mainMenus.menu.map((resMenu: MenuItem) => {
          resMenu.showSubRoute = false;
        });
      });
    }
  }

  public switchMobileSideBarPosition(): void {
    if (localStorage.getItem('isMobileSidebar')) {
      this.toggleMobileSideBar.next("false");
      localStorage.removeItem('isMobileSidebar');
    } else {
      this.toggleMobileSideBar.next("true");
      localStorage.setItem('isMobileSidebar', 'true');
    }
  }
  public changeThemeColor(themeColors: string): void {
    this.themeColors.next(themeColors);
    localStorage.setItem('themeColor', themeColors);
    this.renderer.setAttribute(
      document.documentElement,
      'data-bs-theme', 
      themeColors === 'light'
        ? 'light'
        : 'dark'
    );
  }
  layoutHidden=false;
  togglehidden():void{
  // this.layoutHidden=!this.
  const hidden=document.body;
    this.layoutHidden = !this.layoutHidden;
  if(this.layoutHidden){
    hidden.classList.add('hidden-layout')
  }else(
    hidden.classList.remove('hidden-layout')
  )
}
}
