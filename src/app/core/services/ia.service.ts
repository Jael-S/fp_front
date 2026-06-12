import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  IaResponse, GenerarDiagramaResponse, CuelloBotellaResponse, GenerarFormularioResponse,
  GenerarDiagramaJointJsResponse,
} from '../models/ia.model';

@Injectable({ providedIn: 'root' })
export class IaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ia`;

  /** Chat NLP: pregunta al asistente. */
  preguntar(pregunta: string): Observable<IaResponse> {
    return this.http
      .post<ApiResponse<IaResponse>>(`${this.baseUrl}/preguntar`, { pregunta })
      .pipe(map((r) => r.data));
  }

  /** Genera diagrama BPMN desde descripción en lenguaje natural. */
  generarDiagrama(descripcion: string): Observable<GenerarDiagramaResponse> {
    return this.http
      .post<ApiResponse<GenerarDiagramaResponse>>(`${this.baseUrl}/generar-diagrama`, { descripcion })
      .pipe(map((r) => r.data));
  }

  /** Analiza cuellos de botella de una política (Java puro, GET). */
  analizarCuellos(politicaId: string): Observable<CuelloBotellaResponse> {
    return this.http
      .get<ApiResponse<CuelloBotellaResponse>>(`${this.baseUrl}/analizar-cuellos/${politicaId}`)
      .pipe(map((r) => r.data));
  }

  /** Analiza cuellos de botella con ML (ensemble via fp_services, POST). */
  analizarCuellosConIa(politicaId: string): Observable<CuelloBotellaResponse> {
    return this.http
      .post<ApiResponse<CuelloBotellaResponse>>(`${this.baseUrl}/analizar-cuellos/${politicaId}`, {})
      .pipe(map((r) => r.data));
  }

  /** Genera campos de formulario a partir de la descripción de una tarea. */
  generarFormulario(descripcion: string, nombreNodo: string): Observable<GenerarFormularioResponse> {
    return this.http
      .post<ApiResponse<GenerarFormularioResponse>>(`${this.baseUrl}/generar-formulario`, { descripcion, nombreNodo })
      .pipe(map((r) => r.data));
  }

  /**
   * Genera un diagrama en formato JointJS (nodos + transiciones JSON).
   * Envía los departamentos disponibles para que la IA los asigne correctamente.
   */
  generarDiagramaJointJs(
    descripcion: string,
    departamentos: Array<{ id: string; nombre: string }>,
  ): Observable<GenerarDiagramaJointJsResponse> {
    return this.http
      .post<ApiResponse<GenerarDiagramaJointJsResponse>>(
        `${this.baseUrl}/generar-diagrama`,
        { descripcion, departamentos },
      )
      .pipe(map((r) => r.data));
  }
}
