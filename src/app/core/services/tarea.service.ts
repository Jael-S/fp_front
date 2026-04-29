import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface TareaFormularioRequest {
  formularioId: string;
}

export interface RelacionCarrilRequest {
  carrilId: string;
  carrilNombre: string;
  departamentoId: string;
  departamentoNombre: string;
}

export interface RelacionCarrilResponse {
  carrilId: string;
  carrilNombre: string;
  departamentoId: string;
  departamentoNombre: string;
}

/** Config persistida de una tarea BPMN (por elementId) */
export interface NodoPorElementoConfig {
  id: string;
  elementId: string | null;
  politicaId: string | null;
  nombre: string | null;
  departamentoId: string | null;
  formularioId: string | null;
}

@Injectable({ providedIn: 'root' })
export class TareaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/nodos`;

  /**
   * Guardar relación carril-departamento
   */
  guardarRelacionCarril(
    politicaId: string,
    request: RelacionCarrilRequest
  ): Observable<RelacionCarrilResponse> {
    return this.http
      .post<ApiResponse<RelacionCarrilResponse>>(
        `${this.baseUrl}/carriles/${politicaId}/relacion`,
        request
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Obtener relación carril-departamento
   */
  obtenerRelacionCarril(
    politicaId: string,
    carrilId: string
  ): Observable<RelacionCarrilResponse> {
    return this.http
      .get<ApiResponse<RelacionCarrilResponse>>(
        `${this.baseUrl}/carriles/${politicaId}/relacion/${carrilId}`
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Obtener nodo guardado por elementId BPMN y política (nombre, departamento, formulario).
   */
  obtenerNodoPorElementoYPolitica(
    elementId: string,
    politicaId: string
  ): Observable<NodoPorElementoConfig | null> {
    return this.http
      .get<ApiResponse<NodoPorElementoConfig | null>>(
        `${this.baseUrl}/elemento/${encodeURIComponent(elementId)}/politica/${encodeURIComponent(politicaId)}`
      )
      .pipe(map((res) => res.data ?? null));
  }

  /**
   * Asignar formulario a una tarea (por elementId del nodo BPMN)
   */
  asignarFormularioATarea(
    politicaId: string,
    nodoElementId: string,
    formularioId: string
  ): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(
        `${this.baseUrl}/tareas/${politicaId}/${nodoElementId}/formulario?formularioId=${formularioId}`,
        {}
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Configurar tarea por elementId BPMN: nombre, departamento y formulario.
   */
  configurarNodoPorElementId(
    nodoElementId: string,
    body: {
      politicaId: string;
      nombre: string;
      departamentoId: string | null;
      formularioId: string | null;
    }
  ): Observable<unknown> {
    return this.http
      .put<ApiResponse<unknown>>(`${this.baseUrl}/${encodeURIComponent(nodoElementId)}/config`, {
        politicaId: body.politicaId,
        nombre: body.nombre ?? '',
        departamentoId: body.departamentoId ?? '',
        formularioId: body.formularioId ?? '',
      })
      .pipe(map((res) => res.data));
  }

  /**
   * Asignar un formulario a una tarea/nodo (método heredado)
   * @param nodeId ID del nodo en MongoDB
   * @param formularioId ID del formulario a asignar
   */
  asignarFormulario(nodeId: string, formularioId: string): Observable<any> {
    const payload = { formularioId };
    return this.http
      .put<ApiResponse<any>>(`${this.baseUrl}/${nodeId}/formulario`, payload)
      .pipe(map((res) => res.data));
  }

  /**
   * Obtener formularios disponibles (no implementado en backend aún)
   * @param nodeId ID del nodo
   */
  obtenerFormularios(nodeId: string): Observable<any[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.baseUrl}/${nodeId}/formularios`)
      .pipe(map((res) => res.data ?? []));
  }

  /**
   * Actualizar tipo de transición/flujo de una decisión
   * @param nodeId ID del nodo decisión (ExclusiveGateway)
   * @param tipoFlujo Tipo de flujo (SECUENCIAL, ALTERNATIVO, PARALELO, ITERATIVO)
   */
  actualizarTipoFlujo(
    nodeId: string,
    tipoFlujo: 'SECUENCIAL' | 'ALTERNATIVO' | 'PARALELO' | 'ITERATIVO',
    politicaId: string | null
  ): Observable<any> {
    const body: { tipoFlujo: string; politicaId?: string } = { tipoFlujo };
    if (politicaId) {
      body.politicaId = politicaId;
    }
    return this.http
      .put<ApiResponse<any>>(`${this.baseUrl}/${encodeURIComponent(nodeId)}/tipo-flujo`, body)
      .pipe(map((res) => res.data));
  }
}
