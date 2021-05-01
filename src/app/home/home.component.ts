import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  Message,
  ServerConnectionService,
  ClientIdentity,
} from '../server-connection.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private _subscriptions: Subscription[] = [];

  @ViewChild('input') inputElement?: HTMLInputElement;
  usersOnline: ClientIdentity[] = [];
  messages: Message[] = [];

  id: string = '';
  username: string = '';
  rooms: string[] = [];
  currentRoom: string = '';

  // usernameControl: FormGroup;

  constructor(private _connection: ServerConnectionService) {
    const connectSub = this._connection.onConnect().subscribe(() => {
      this.id = '';
      this.username = this._connection.getCurrentUsername();
      this.rooms = [];
      this.currentRoom = '';
      this.messages = [];
      this.usersOnline = [];
    });

    const messageReceiveSub = this._connection
      .getObservableEventStream('client-broadcast-message')
      .subscribe((message) => {
        this.messages = [...this.messages, message];
      });

    const usernameSub = this._connection
      .getObservableUsername()
      .subscribe((username) => (this.username = username));

    const usersSub = this._connection
      .getObservablePeerIDList()
      .subscribe((identity) => {
        this.usersOnline = identity;

        this._connection.fetchAvailableRooms((rooms: string[]) => {
          this.rooms = rooms;
        });
      });

    const connectionIDSub = this._connection
      .getObservableID()
      .subscribe((id) => (this.id = id));

    const roomListSub = this._connection
      .getObservableRooms()
      .subscribe((rooms) => (this.rooms = rooms));

    const currentRoomSub = this._connection
      .getObservableRoom()
      .subscribe((room) => {
        this.currentRoom = room;
      });

    this._subscriptions.push(
      connectSub,
      messageReceiveSub,
      usernameSub,
      usersSub,
      connectionIDSub
    );
  }

  moveRoom(room: string): void {
    console.log('Asking to move to room ', room);
    this._connection.moveToRoom(() => {}, room);
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach((sub) => sub.unsubscribe());
  }

  ngOnInit(): void {}

  getUsername(clientID: string): string {
    return this._connection.mapIDToUsername(clientID);
  }

  sendMessage(text: string, room?: string) {
    if (text) {
      const message = this._connection.composeMessage(
        ServerConnectionService.BROADCAST_ID,
        text
      );
      this._connection.sendBroadcastMessage(message, room);
    }
  }

  updateUsername(text: string) {
    this._connection.updateUsername(text);
  }
}
