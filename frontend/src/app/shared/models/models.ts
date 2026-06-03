export interface SubMenu {
  menuValue: string;
  hasSubRouteTwo2?: boolean;
  route?: string;
  base?: string;
  subMenus?: SubMenu[];
}

export interface MenuItem {
  menuValue: string;
  labelKey?: string;
  hasSubRoute: boolean;
  showSubRoute: boolean;
  hasSubRouteTwo2?: boolean;
  base: string;
  route?: string;
  img?: string;
  icon?: string;
  faIcon?: boolean;
  subMenus: SubMenu[];
}

export interface SideBarData {
  tittle: string;
  showAsTab: boolean;
  separateRoute: boolean;
  menu: MenuItem[];
}
