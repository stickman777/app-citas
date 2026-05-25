import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { routes } from '../../../../src/app/shared/routes/routes';

@Component({
    selector: 'app-error404',
    templateUrl: './error404.component.html',
    styleUrls: ['./error404.component.scss'],
    imports: [CommonModule,RouterLink]
})
export class Error404Component {
  public routes = routes;
}
