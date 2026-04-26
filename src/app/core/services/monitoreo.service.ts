import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MonitoreoService {
  private client?: Client;

  connect(topic: string, onMessage: (payload: unknown) => void): void {
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      reconnectDelay: 3000,
      onConnect: () => {
        this.client?.subscribe(topic, (message: IMessage) => {
          onMessage(JSON.parse(message.body));
        });
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    this.client?.deactivate();
  }
}
