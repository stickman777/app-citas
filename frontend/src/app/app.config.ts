import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { NgxMaskModule } from 'ngx-mask';
import { provideToastr } from 'ngx-toastr';
import { authInterceptor } from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    BsDatepickerModule.forRoot().providers!,
    provideAnimations(),
    provideToastr({
      timeOut: 2000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
    NgxMaskModule.forRoot({
      showMaskTyped: false,
    }).providers!,
  ],
};
