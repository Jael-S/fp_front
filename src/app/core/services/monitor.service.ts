import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface NodoMonitorInfo {
  nodoId: string;
  elementId: string;
  nombre: string;
  tipo: string;
  tramitesActivos: number;
  funcionarios: string[];
  tiempoPromedioMin: number;
  estado: 'SIN_TRAMITES' | 'PENDIENTE' | 'EN_PROCESO';
}

export interface MonitorData {
  politicaId: string;
  total: number;
  pendientes: number;
  enProceso: number;
  completados: number;
  rechazados: number;
  /** Indexado por elementId BPMN (ej. "Task_1", "StartEvent_1") */
  nodos: Record<string, NodoMonitorInfo>;
}

// ─── Tipo monitor por trámite ─────────────────────────────────────────────────

export interface EjecucionHistorialInfo {
  nodoNombre: string;
  estado: string;
  inicio: string | null;
  fin: string | null;
  duracionMinutos: number;
}

export interface TramiteMonitorData {
  tramiteId: string;
  titulo: string;
  estado: string;
  nodoActualNombre: string | null;
  departamentoActualNombre: string | null;
  funcionarioActualNombre: string | null;
  tiempoTranscurridoMinutos: number;
  /** elementId BPMN → COMPLETADO | EN_PROCESO | PENDIENTE | PENDIENTE_FUTURO */
  estadoNodos: Record<string, string>;
  historialEjecuciones: EjecucionHistorialInfo[];
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class MonitorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/monitor`;
  private client?: Client;

  /** Estado general de todos los trámites de una política. */
  getEstado(politicaId: string): Observable<MonitorData> {
    return this.http
      .get<ApiResponse<MonitorData>>(`${this.baseUrl}/${politicaId}`)
      .pipe(map((r) => r.data));
  }

  /** Progreso detallado de UN trámite específico. */
  getEstadoTramite(tramiteId: string): Observable<TramiteMonitorData> {
    return this.http
      .get<ApiResponse<TramiteMonitorData>>(`${this.baseUrl}/tramite/${tramiteId}`)
      .pipe(map((r) => r.data));
  }

  /**
   * Suscribe al topic WebSocket de la política.
   * `onUpdate` es un callback sin argumentos: al recibir cualquier mensaje
   * el componente hace un reload HTTP fresco (el mensaje es solo un "ping").
   */
  watch(politicaId: string, onUpdate: () => void): void {
    this.disconnect();
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsMonitorUrl) as unknown as WebSocket,
      reconnectDelay: 3000,
      onConnect: () => {
        this.client?.subscribe(`/topic/monitor/${politicaId}`, () => onUpdate());
      },
    });
    this.client.activate();
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = undefined;
  }
}
