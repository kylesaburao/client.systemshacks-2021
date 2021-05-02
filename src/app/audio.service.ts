import { Injectable } from '@angular/core';
import { Howl } from 'howler';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private _enable: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    true
  );

  private _countingDown: boolean = false;

  constructor() {}

  setEnable(state: boolean): void {
    this._enable.next(state);

    if (!state) {
      this.mute();
      if (!this._countingDown) {
        this._countingDown = true;
        setTimeout(() => {
          this.setEnable(true);
          this._countingDown = false;
        }, 5 * 1000);
      }
    } else {
      this.unmute();
    }
  }

  getEnable(): Observable<boolean> {
    return this._enable.asObservable();
  }

  message(): void {
    if (this._enable.value) new Howl({ src: ['assets/Cyclist.ogg'] }).play();
  }

  roomMessage(): void {
    if (this._enable.value) new Howl({ src: ['assets/Magic.ogg'] }).play();
  }

  user(): void {
    if (this._enable.value) new Howl({ src: ['assets/Flower.ogg'] }).play();
  }

  login(): void {
    if (this._enable.value) new Howl({ src: ['assets/Portal.ogg'] }).play();
  }

  mute(): void {
    new Howl({ src: ['assets/Stem.ogg'] }).play();
  }

  unmute(): void {
    new Howl({ src: ['assets/Nightlife.ogg'] }).play();
  }
}
