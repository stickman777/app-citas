import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationStart, Router, Event as RouterEvent, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'template';
  public base = '';
  public page = '';
  constructor(private router: Router) {
    this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationStart) {
        const URL = event.url.split('/');
        this.base =URL[1] ? URL[1].replaceAll('-',' '): '';
        this.page = URL[2] ? URL[2].replace('-',' '): '';
      }
      if(this.base === 'index'){
        this.page = 'Admin Dashboard'
      }
      if(this.base === 'staffs' || this.base === 'locations'
        ||this.base ==='services' || this.base === 'specializations' ||this.base === 'assets' ||this.base === 'activities'
        ||this.base ==='messages' || this.base === 'departments' ||this.base === 'designation' ||this.base === 'attendance'
        ||this.base ==='holidays' || this.base === 'payroll' ||this.base === 'income' ||this.base === 'payments'
        ||this.base ==='transactions' || this.base === 'announcements' ||this.base === 'newsletters' ||this.base === 'starter'
        ||this.base ==='contact messages' || this.base === 'tickets' ||this.base === 'testimonials' ||this.base === 'faq'||this.base === 'profile'
        ||this.base ==='gallery' || this.base === 'timeline' ||this.base === 'pricing' ||this.base === 'privacy policy'||this.base === 'terms and conditions'
        ||this.base ==='login' || this.base === 'login cover' ||this.base === 'email verification cover' ||this.base === 'two step verification cover'
        ||this.base ==='login basic' || this.base === 'forgot password basic' ||this.base === 'email verification basic' ||this.base === 'two step verification basic'
        ||this.base ==='login illustration' || this.base === 'forgot password cover' ||this.base === 'forgot password illustration' || this.base === 'email verification illustration' ||this.base === 'two step verification illustration'
        ||this.base === 'success basic'||this.base === 'success cover'||this.base === 'success illustration'
        ||this.base ==='reset password basic' ||this.base ==='reset password cover' ||this.base ==='reset password illustration'|| this.base === 'coming soon' ||this.base === 'under maintenance' 
        ||this.base ==='layout fullwidth' || this.base === 'layout hoverview' ||this.base === 'layout rtl' 
        ||this.base ==='layout mini' || this.base === 'layout hidden' ||this.base === 'layout dark' 
        ||this.base ==='notifications' 
      ){
        this.page = this.base
      }
      // if (event instanceof NavigationEnd){}
    });
  }
}
