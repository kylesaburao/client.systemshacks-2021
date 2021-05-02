import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  ɵCompiler_compileModuleSync__POST_R3__,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ComponentCommService } from '../component-comm.service';
import {
  Message,
  ServerConnectionService,
  ClientIdentity,
} from '../server-connection.service';
import { AudioService } from '../audio.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private _subscriptions: Subscription[] = [];

  @ViewChild('input') inputElement?: HTMLInputElement;
  @ViewChild('messagesListing') messagesView?: ElementRef;

  usersOnline: ClientIdentity[] = [];
  messages: Message[] = [];

  id: string = '';
  username: string = '';
  rooms: string[] = [];
  currentRoom: string = '';

  isMuted: boolean = false;

  // usernameControl: FormGroup;

  constructor(
    private _connection: ServerConnectionService,
    private _renderer: Renderer2,
    private _comm: ComponentCommService,
    private _audio: AudioService
  ) {
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

        if (!message.isRoomOnly) {
          this._audio.message();
        } else {
          this._audio.roomMessage();
        }

        setTimeout(() => {
          if (this.messagesView) {
            const scrollTopBefore = this.messagesView.nativeElement.scrollTop;
            const newValue = this.messagesView.nativeElement.scrollHeight;
            this._renderer.setProperty(
              this.messagesView.nativeElement,
              'scrollTop',
              newValue
            );
          }
        }, 0);
      });

    const usernameSub = this._connection
      .getObservableUsername()
      .subscribe((username) => (this.username = username));

    const usersSub = this._connection
      .getObservablePeerIDList()
      .subscribe((identity) => {
        this.usersOnline = identity;

        this._audio.user();

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

    const muteSub = this._audio.getEnable().subscribe((enable) => {
      this.isMuted = !enable;
    });

    this._subscriptions.push(
      connectSub,
      messageReceiveSub,
      usernameSub,
      usersSub,
      connectionIDSub,
      roomListSub,
      currentRoomSub,
      muteSub
    );
  }

  ngAfterViewInit(): void {}

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

  emergencyLogout(): void {
    console.log('Sending logout broadcast');
    this._comm.lockout.next(true);
  }

  setMute(enable: boolean): void {
    this._audio.setEnable(enable);
  }
}
