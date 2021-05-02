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

  countdownText: BehaviorSubject<string> = new BehaviorSubject<string>('');

  private _countingDown: boolean = false;
  private _countDown: number = 0;
  private readonly _maxTime: number = 4000;

  constructor() {}

  setEnable(state: boolean): void {
    this._enable.next(state);

    if (!state) {
      this.mute();

      if (!this._countingDown) {
        this._countDown = this._maxTime;
        this._countingDown = true;

        let interval = setInterval(() => {
          const text = this._countDown <= 0 ? '' : `${this._countDown / 1000}`;
          this.countdownText.next(text);
          if (this._countDown <= 0) {
            clearInterval(interval);
            this._countDown = 0;
            this.setEnable(true);
            this._countingDown = false;
          } else {
            this._countDown -= 1000;
          }
        }, 1000);
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

  alert(): void {
    new Howl({ src: ['assets/DJ.ogg'] }).play();
  }
}
