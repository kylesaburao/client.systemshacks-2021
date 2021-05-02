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

  usersInCurrentRoom: string[] = [];
  sendToGlobal: boolean = true;

  isMuted: boolean = false;
  muteText: string = '';
  inputText: string = '';

  // usernameControl: FormGroup;

  constructor(
    private _connection: ServerConnectionService,
    private _renderer: Renderer2,
    private _comm: ComponentCommService,
    private _audio: AudioService
  ) {
    this._audio.countdownText.subscribe((text) => {
      this.muteText = text;
    });
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

    this._connection.onRoomMembershipChanged.subscribe((insideRoom) => {
      this.usersInCurrentRoom = insideRoom;
    });

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

    const alertSub = this._connection.onAlert.subscribe(() =>
      this._audio.alert()
    );

    this._subscriptions.push(
      connectSub,
      messageReceiveSub,
      usernameSub,
      usersSub,
      connectionIDSub,
      roomListSub,
      currentRoomSub,
      muteSub,
      alertSub
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

  sendMessage(message: string) {
    const sendMessage = (text: string, clearInput: boolean) => {
      if (text) {
        const message = this._connection.composeMessage(
          ServerConnectionService.BROADCAST_ID,
          text
        );
        let room: string | undefined = undefined;
        if (!this.sendToGlobal) {
          room = this.currentRoom;
        }
        this._connection.sendBroadcastMessage(message, room);

        if (clearInput) {
          this.inputText = '';
        }
      }
    };

    if (message === 'WAKEUP') {
      let counter = 25;

      let interval = setInterval(() => {
        if (counter > 0) {
          let randomMessage: string =
            Math.random()
              .toString(16)
              .replace(/[^a-z]+/g, '') +
            Math.random()
              .toString(16)
              .replace(/[^a-z]+/g, '');
          sendMessage(randomMessage, counter > 1);
        } else {
          clearInterval(interval);
        }
        --counter;
      }, 32);
    } else {
      sendMessage(message, true);
    }
  }

  updateUsername(text: string) {
    if (text) {
      this._connection.updateUsername(text);
    }
  }

  emergencyLogout(): void {
    console.log('Sending logout broadcast');
    this._comm.lockout.next(true);
  }

  setMute(enable: boolean): void {
    this._audio.setEnable(enable);
  }

  alert(): void {
    this._connection.sendAlert();
  }
}
