import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MensajeAgente {
  rol: 'cliente' | 'agente';
  contenido: string;
  tipo: string;
  timestamp: string;
}

export interface RespuestaAgente {
  conversacionId: string;
  mensajeAgente: string;
  estado: string;
  politicaDetectada?: string;
  politicaId?: string;
  tramiteId?: string;
  codigoSeguimiento?: string;
  requisitoActual?: string;
}

export interface ConversacionActiva {
  tieneConversacionActiva: boolean;
  conversacionId?: string;
  estadoConversacion?: string;
  mensajes?: MensajeAgente[];
  tramiteId?: string;
  requisitoActual?: string;
}

export interface EstadoTramite {
  tramiteId: string;
  codigoSeguimiento: string;
  estado: string;
  politicaNombre: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class AgenteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cliente/agente`;

  enviarMensaje(mensaje: string, conversacionId?: string, tipo = 'texto'): Observable<RespuestaAgente> {
    return this.http.post<RespuestaAgente>(`${this.base}/mensaje`, {
      conversacionId: conversacionId ?? null,
      mensaje,
      tipo
    });
  }

  obtenerConversacionActiva(): Observable<ConversacionActiva> {
    return this.http.get<ConversacionActiva>(`${this.base}/conversacion-activa`);
  }

  obtenerEstadoTramite(tramiteId: string): Observable<{ data: EstadoTramite }> {
    return this.http.get<{ data: EstadoTramite }>(`${this.base}/estado-tramite/${tramiteId}`);
  }

  obtenerHistorial(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.base}/historial`);
  }

  subirDocumento(archivo: File, conversacionId: string): Observable<RespuestaAgente> {
    const fd = new FormData();
    fd.append('archivo', archivo, archivo.name);
    fd.append('conversacionId', conversacionId);
    return this.http.post<RespuestaAgente>(`${this.base}/documento`, fd);
  }
}
