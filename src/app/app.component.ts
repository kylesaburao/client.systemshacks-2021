import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RecaptchaComponent } from 'ng-recaptcha';
import { ComponentCommService } from './component-comm.service';
import { ServerConnectionService } from './server-connection.service';
import { Howl } from 'howler';
import { AudioService } from './audio.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'client-systemhacks';
  captchaResolved: boolean = true;

  @ViewChild('recaptcha', { read: RecaptchaComponent })
  recaptcha?: RecaptchaComponent;

  captchaForm: FormGroup;

  constructor(
    private _connection: ServerConnectionService,
    private _comm: ComponentCommService,
    private _audio: AudioService
  ) {
    this.captchaForm = new FormGroup({
      recaptcha: new FormControl(null, Validators.required),
    });

    // this.captchaForm.get('recaptcha').

    this._comm.lockout.subscribe((value) => {
      console.log(value, 'hi');
      console.log(this.recaptcha);
      if (value && this.recaptcha !== undefined) {
        this.recaptcha.reset();
        this.captchaResolved = false;
      }
    });
  }

  recaptchaResolved(event: string) {
    this._connection.queryRecaptchaValidator(event, (success: boolean) => {
      this.captchaResolved = success;

      if (success) {
        this._audio.login();
      }
    });
  }
}
