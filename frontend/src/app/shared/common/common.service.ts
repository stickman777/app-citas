import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  public baseRoute: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public pageRoute: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public lastRoute: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public currentRoute: BehaviorSubject<string> = new BehaviorSubject<string>(
    ''
  );

 
}
