import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ServerConnectionService } from './server-connection.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'client-systemhacks';
  captchaResolved: boolean = false;

  captchaForm: FormGroup;

  constructor(private _connection: ServerConnectionService) {
    this.captchaForm = new FormGroup({
      recaptcha: new FormControl(null, Validators.required),
    });
  }

  recaptchaResolved(event: string) {
    this._connection.queryRecaptchaValidator(event, (success: boolean) => {
      this.captchaResolved = success;
    });
  }
}
