import { Component } from '@angular/core';
import { routes } from '../../../../src/app/shared/routes/routes';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
@Component({
    selector: 'app-error500',
    templateUrl: './error500.component.html',
    styleUrls: ['./error500.component.scss'],
    imports: [CommonModule,RouterLink]
})
export class Error500Component {
public routes = routes;
}
