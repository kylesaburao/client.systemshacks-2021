import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import random from 'random';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Message {
  time?: number;
  senderUsername?: string;
  senderID?: string;
  recipientID: string;
  message: string;
  payload?: Object;
  isRoomOnly?: boolean;
}

const EVENTS = {
  internal: 'INTERNAL',
};

interface InternalMessage {
  data: Message;
  room?: string;
}

export interface ClientIdentity {
  username: string;
  id: string;
}

type Rooms = string[];

@Injectable({
  providedIn: 'root',
})
export class ServerConnectionService {
  static readonly BROADCAST_ID: string = '';

  private _onConnect: Subject<void>;
  private _onDisconnect: Subject<string>;
  private _onConnectionError: Subject<string>;
  private _clientID: BehaviorSubject<string>;
  private _peers: BehaviorSubject<ClientIdentity[]>;
  private _peerIDNameMap: { [key: string]: string };
  private _username: BehaviorSubject<string>;
  private _room: BehaviorSubject<string>;
  private _rooms: BehaviorSubject<string[]>;

  constructor(private _socket: Socket) {
    this._onConnect = new Subject<void>();
    this._onDisconnect = new Subject<string>();
    this._onConnectionError = new Subject<string>();
    this._clientID = new BehaviorSubject<string>('');
    this._peers = new BehaviorSubject<ClientIdentity[]>([]);
    this._username = new BehaviorSubject<string>('');
    this._room = new BehaviorSubject<string>('?');
    this._rooms = new BehaviorSubject<string[]>([]);
    this._peerIDNameMap = {};

    this._socket.on('connect', () => {
      console.log('Connected to server');
      this._onConnect.next();
      // this._socket.emit(EVENTS.internal, this._getCurrentTime());

      this.fetchAvailableRooms((rooms: string[]) => {
        this._rooms.next(rooms);
      });

      const persistedUsername: string | null = localStorage.getItem('username');

      if (persistedUsername !== null) {
        this.updateUsername(persistedUsername);
      }
      if (this._username.value === '') {
        this.updateUsername(`User${random.int(0, 100)}`);
      } else {
        this.updateUsername(this._username.value);
      }
    });

    this._socket.on('disconnect', (reason: string) => {
      console.log('Disconnecting:', reason);
      this._onDisconnect.next(reason);
    });

    this._socket.on('connect_error', (reason: string) => {
      console.log('Connection error:', reason);
      this._onConnectionError.next(reason);
    });

    this._socket.fromEvent('rooms-updated').subscribe((event) => {
      const rooms: string[] = event as string[];
      this._rooms.next(rooms);
    });

    this._socket.fromEvent('you-are').subscribe((event) => {
      const id = event as string;
      this._clientID.next(id);
      console.log(`Updated client ID: ${id}`);

      if (this._room.value === '?') {
        this._room.next(id);
      }
      this.moveToRoom(() => {}, id);
    });

    this._username.subscribe((username) => {
      if (username) {
        this._socket.emit('client-update-username', username);
      }
    });

    this._socket.on('update-single-peer', (peer: ClientIdentity) => {
      const peerData: ClientIdentity[] = this._peers.value;

      let found: boolean = false;
      for (let currentPeer of peerData) {
        if (currentPeer.id === peer.id) {
          currentPeer.username = peer.username;
          found = true;
          break;
        }
      }

      if (!found) {
        peerData.push(peer);
      }

      this._peerIDNameMap[peer.id] = peer.username;
      this._peers.next(peerData);
    });

    this._socket.on('update-all-peers', (peers: ClientIdentity[]) => {
      // console.log('Updating all peers list', peers);
      this._peers.next(peers);

      this._peerIDNameMap = {};
      for (let peer of peers) {
        this._peerIDNameMap[peer.id] = peer.username;
      }
    });

    this._socket.on('room-update', (data: { [key: string]: any }) => {
      console.log(data);
      console.log('moving to room ', data.room);
      this._room.next(data.room);
    });
  }

  onConnect(): Observable<void> {
    return this._onConnect.asObservable();
  }

  onDisconnect(): Observable<string> {
    return this._onConnectionError.asObservable();
  }

  onConnectionError(): Observable<string> {
    return this._onConnectionError.asObservable();
  }

  composeMessage(recipientID: string, text: string, data?: Object): Message {
    let message: Message = {
      recipientID: recipientID,
      message: text,
      payload: data,
      senderID: this._clientID.value,
      senderUsername: this._username.value,
    };
    // console.log(message);
    return message;
  }

  updateUsername(username: string): void {
    this._peerIDNameMap[this._clientID.value] = username;
    this._username.next(username);
    localStorage.setItem('username', username);
  }

  moveToRoom(func: Function, room: string) {
    // this._socket.emit('move-room', room);
    this.leaveRoom(this._room.value);
    this.joinRoom(room);
  }

  joinRoom(room: string) {
    this._socket.emit('join-room', room);
  }

  leaveRoom(room: string) {
    this._socket.emit('leave-room', room);
  }

  getObservableRooms(): Observable<Rooms> {
    return this._rooms.asObservable();
  }

  getCurrentUsername(): string {
    return this._username.value;
  }

  getObservableRoom(): Observable<string> {
    return this._room.asObservable();
  }

  getObservableUsername(): Observable<string> {
    return this._username.asObservable();
  }

  getObservableID(): Observable<string> {
    return this._clientID.asObservable();
  }

  getObservablePeerIDList(): Observable<ClientIdentity[]> {
    return this._peers.asObservable();
  }

  getObservableEventStream(event: string): Observable<Message> {
    return (this._socket.fromEvent(event) as Observable<InternalMessage>).pipe(
      map((internal) => internal.data)
    );
  }

  fetchAvailableRooms(func: Function): void {
    this._socket.once('available-rooms', (roomList: string[]) => {
      func(roomList);
    });

    this._socket.emit('query-available-rooms', 'hi');
  }

  fetchRoomMembership(
    func: (membership: { [key: string]: string[] }) => void
  ): void {
    this._socket.once(
      'room-membership',
      (roomMembership: { [key: string]: string[] }) => {
        func(roomMembership);
      }
    );

    this._socket.emit('query-room-membership', 'hi');
  }

  sendTargetedMessage(clientID: string, message: Message) {
    this._attachFields(clientID, message);
    let internal: InternalMessage = this._constructInternalMessage(message);
    this._socket.emit('client-targeted-message', internal);
  }

  sendBroadcastMessage(message: Message, room?: string) {
    this._attachFields(ServerConnectionService.BROADCAST_ID, message);
    let internal: InternalMessage = this._constructInternalMessage(
      message,
      room
    );
    this._socket.emit('client-broadcast-message', internal);
  }

  mapIDToUsername(clientID: string): string {
    let username: string = '';
    if (clientID in this._peerIDNameMap) {
      username = this._peerIDNameMap[clientID];
    }
    return username;
  }

  private _constructInternalMessage(
    message: Message,
    room?: string
  ): InternalMessage {
    let internal: InternalMessage = { data: message, room: room };

    return internal;
  }

  private _attachFields(recipientID: string, message: Message) {
    message.recipientID = recipientID;
    message.senderID = this._clientID.value;
    message.time = this._getCurrentTime();
    message.senderUsername = this.getCurrentUsername();
  }

  private _getCurrentTime(): number {
    return new Date().getTime();
  }

  queryRecaptchaValidator(key: string, callback: Function) {
    this._socket.once('recaptcha-verify-status', (result: boolean) => {
      callback(result);
    });
    this._socket.emit('verify-recaptcha', key);
  }
}
