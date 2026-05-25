import { Component } from '@angular/core';
import { routes } from '../../../shared/routes/routes';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  imports: [CommonModule,RouterLink]
})
export class MessagesComponent {
  routes=routes
  public chatSearch = false;
  public emoji = false;
  showChatSearch(){
    this.chatSearch = !this.chatSearch;
  }
  toggleemoji(){
    this.emoji=!this.emoji
  }
}
