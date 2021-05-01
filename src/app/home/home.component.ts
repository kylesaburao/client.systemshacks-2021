import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import random from 'random';
import { Message, ServerConnectionService } from '../server-connection.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  @ViewChild('input') inputElement?: HTMLInputElement;
  usersOnline: string[] = [];
  messages: Message[] = [];
  username: string = '';

  constructor(private _connection: ServerConnectionService) {
    // this._connection.sendBroadcastMessage({
    //   recipientID: ServerConnectionService.BROADCAST_ID,
    //   message: 'hello',
    // });
    this._connection
      .getObservableEventStream('client-broadcast-message')
      .subscribe((message) => {
        this.messages = [...this.messages, message];
      });
    // todo subscription delete on ngdestroy
    this._connection
      .getObservableUsername()
      .subscribe((username) => (this.username = username));
  }

  ngOnInit(): void {}

  sendMessage(text: string) {
    if (text) {
      const message: Message = {
        message: text,
        recipientID: ServerConnectionService.BROADCAST_ID,
      };
      this._connection.sendBroadcastMessage(message);
      this.messages = [...this.messages, message];
    }
  }
}
