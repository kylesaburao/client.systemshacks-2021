import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  RecaptchaFormsModule,
  RecaptchaModule,
  RECAPTCHA_SETTINGS,
} from 'ng-recaptcha';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { WEBSOCKET_URL } from './server-values';

const socketConfig: SocketIoConfig = { url: WEBSOCKET_URL, options: {} };
const RECAPTCHA_SITE_KEY = '6LdKSsIaAAAAAEF658Vl_dtDB3mLhkdguCXkC09a';

@NgModule({
  declarations: [AppComponent, HomeComponent],
  imports: [
    MatButtonModule,
    MatCardModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    SocketIoModule.forRoot(socketConfig),
    FlexLayoutModule,
    RecaptchaModule,
    RecaptchaFormsModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: RECAPTCHA_SETTINGS, useValue: { siteKey: RECAPTCHA_SITE_KEY } },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
