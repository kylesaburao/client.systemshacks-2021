import { Component, OnInit } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import random from 'random';

interface UserMessage {
  clientID: string,
  username: string;
  message: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  id: string = '';
  username: string = `${random.int(0, 10000)}`;
  usersOnline: string[] = [];
  messages: UserMessage[] = [];

  constructor(private _socket: Socket) {
    this._socket.on('connect', () => {
      this._socket.emit('hello', 'hi');
    });
    this._socket.on('connect_error', (error: Error) => {
      console.log(error);
    });

    this._socket.fromEvent('you-are').subscribe((event) => {
      this.id = event as string;
    });

    this._socket.fromEvent('client-message').subscribe((event) => {
      const message: UserMessage = event as UserMessage;
      this.messages = [...this.messages, message];
    });

    this._socket.fromEvent('refresh-other-ids').subscribe((event) => {
      const ids: string[] = event as string[];
      console.log('refreshing ', ids);
      this.usersOnline = ids;
    });

    this._socket.fromEvent('client-connect').subscribe((event) => {
      this.messages = [
        ...this.messages,
        { clientID: event as string, username: '', message: `${event} connected` },
      ];
      // this.usersOnline = [...this.usersOnline, event as string];
    });

    this._socket.fromEvent('client-disconnect').subscribe((event) => {
      const clientID: string = event as string;

      this.messages = [
        ...this.messages,
        { clientID: event as string, username: '', message: `${clientID} disconnected` },
      ];
    });
  }

  ngOnInit(): void {}

  sendMessage(text: string) {
    if (text) {
      let message: UserMessage = {
        clientID: this.id,
        username: this.username,
        message: text,
      };
      this._socket.emit('client-message', message);

      this.messages = [...this.messages, message];
    }
  }
}
