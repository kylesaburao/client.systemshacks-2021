import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComponentCommService {
  lockout: Subject<Boolean> = new Subject();
  constructor() { }
}
