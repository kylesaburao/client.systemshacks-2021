import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import random from 'random';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Peer {
  username?: string;
  clientID: string;
}

export interface Message {
  time?: number;
  senderID?: string;
  recipientID: string;
  message: string;
  payload?: Object;
}

const EVENTS = {
  internal: 'INTERNAL',
};

interface InternalMessage {
  data: Message;
}

@Injectable({
  providedIn: 'root',
})
export class ServerConnectionService {
  static readonly BROADCAST_ID: string = '';

  private _clientID: string = '';
  private _peers: BehaviorSubject<Peer[]>;
  private _username: BehaviorSubject<string>;

  constructor(private _socket: Socket) {
    this._peers = new BehaviorSubject<Peer[]>([]);
    this._username = new BehaviorSubject<string>(`${random.int(0, 100)}`);

    this._socket.on('connect', () => {
      console.log('Connected to server');
      this._socket.emit(EVENTS.internal, this._getCurrentTime());
    });

    this._socket.fromEvent('you-are').subscribe((event) => {
      this._clientID = event as string;
      console.log(`Updated client ID: ${this._clientID}`);
    });

    this._username.subscribe((username) => {
      this._socket.emit('client-update-username', username);
    });

    // todo auto update peer list from server
  }

  updateUsername(username: string): void {
    this._username.next(username);
  }

  getCurrentUsername(): string {
    return this._username.value;
  }

  getObservableUsername(): Observable<string> {
    return this._username.asObservable();
  }

  getObservablePeerIDList(): Observable<Peer[]> {
    return this._peers.asObservable();
  }

  getObservableEventStream(event: string): Observable<Message> {
    return (this._socket.fromEvent(event) as Observable<InternalMessage>).pipe(
      map((internal) => internal.data)
    );
  }

  sendTargetedMessage(clientID: string, message: Message) {
    this._attachFields(clientID, message);
    let internal: InternalMessage = this._constructInternalMessage(message);
    this._socket.emit('client-targeted-message', internal);
  }

  sendBroadcastMessage(message: Message) {
    this._attachFields(ServerConnectionService.BROADCAST_ID, message);
    let internal: InternalMessage = this._constructInternalMessage(message);
    this._socket.emit('client-broadcast-message', internal);
  }

  private _constructInternalMessage(message: Message): InternalMessage {
    let internal: InternalMessage = { data: message };

    return internal;
  }

  private _attachFields(recipientID: string, message: Message) {
    message.recipientID = recipientID;
    message.senderID = this._clientID;
    message.time = this._getCurrentTime();
  }

  private _getCurrentTime(): number {
    return new Date().getTime();
  }
}
