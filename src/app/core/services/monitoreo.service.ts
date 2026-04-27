import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MonitoreoService {
  private client?: Client;

  connect(topic: string, onMessage: (payload: unknown) => void, monitorSocket = true): void {
    const wsUrl = monitorSocket ? (environment.wsMonitorUrl ?? environment.wsUrl) : environment.wsUrl;
    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
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

  watchPolitica(politicaId: string, onMessage: (payload: unknown) => void): void {
    this.connect(`/topic/monitor/${politicaId}`, onMessage, true);
  }
}
