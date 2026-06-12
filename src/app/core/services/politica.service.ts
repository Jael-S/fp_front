import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import { EstadoPolitica, Politica, PoliticaRequest } from '../models/politica.model';

export interface DiagramaNodoRelacion {
  id: string;
  elementId: string;
  tipo: string;
  texto: string;
  carrilId?: string | null;
  carril?: string | null;
  departamentoId?: string | null;
  formularioId?: string | null;
  condiciones?: Array<{ salida: string; destinoId: string }>;
}

export interface DiagramaTransicionRelacion {
  id: string;
  origenId: string;
  destinoId: string;
  condicion?: string | null;
  tipo?: string | null;
  etiqueta?: string | null;
}

/** Payload al guardar diagrama (elementId BPMN → elementId BPMN) */
export interface TransicionDiagramaGuardado {
  nodoOrigenId: string;
  nodoDestinoId: string;
  etiqueta: string | null;
  tipo: string;
}

export interface DiagramaCompleto {
  politicaId: string;
  diagramaXml: string;
  nodos: DiagramaNodoRelacion[];
  transiciones: DiagramaTransicionRelacion[];
}

@Injectable({ providedIn: 'root' })
export class PoliticaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/politicas`;

  list(page = 0, size = 10, estado?: EstadoPolitica): Observable<PageResponse<Politica>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (estado) params = params.set('estado', estado);
    return this.http.get<ApiResponse<PageResponse<Politica>>>(this.baseUrl, { params }).pipe(map((res) => res.data));
  }

  create(payload: PoliticaRequest): Observable<Politica> {
    return this.http.post<ApiResponse<Politica>>(this.baseUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: PoliticaRequest): Observable<Politica> {
    return this.http.put<ApiResponse<Politica>>(`${this.baseUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  activate(id: string): Observable<Politica> {
    return this.http.post<ApiResponse<Politica>>(`${this.baseUrl}/${id}/activar`, {}).pipe(map((res) => res.data));
  }

  deactivate(id: string): Observable<Politica> {
    return this.http.post<ApiResponse<Politica>>(`${this.baseUrl}/${id}/desactivar`, {}).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(map(() => void 0));
  }

  getById(id: string): Observable<Politica> {
    return this.http.get<ApiResponse<Politica>>(`${this.baseUrl}/${id}`).pipe(map((res) => res.data));
  }

  listActivas(): Observable<Politica[]> {
    return this.http.get<ApiResponse<Politica[]>>(`${this.baseUrl}/activas`).pipe(map((res) => res.data));
  }

  guardarDiagramaCompleto(
    politicaId: string,
    xml: string,
    transiciones?: TransicionDiagramaGuardado[]
  ): Observable<DiagramaCompleto> {
    const body: { xml: string; transiciones?: TransicionDiagramaGuardado[] } = { xml };
    if (transiciones != null && transiciones.length > 0) {
      body.transiciones = transiciones;
    }
    return this.http
      .put<ApiResponse<DiagramaCompleto>>(`${this.baseUrl}/${politicaId}/diagrama/completo`, body)
      .pipe(map((res) => res.data));
  }

  obtenerDiagramaCompleto(politicaId: string): Observable<DiagramaCompleto> {
    return this.http
      .get<ApiResponse<DiagramaCompleto>>(`${this.baseUrl}/${politicaId}/diagrama/completo`)
      .pipe(map((res) => res.data));
  }

  asignarFormularioATarea(politicaId: string, taskId: string, formularioId: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.baseUrl}/${politicaId}/tareas/${taskId}/formulario`, { formularioId })
      .pipe(map(() => void 0));
  }

  guardarCondicionesDecision(
    politicaId: string,
    gatewayId: string,
    payload: { texto: string; condiciones: Array<{ salida: string; destinoId: string }> }
  ): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.baseUrl}/${politicaId}/decisiones/${gatewayId}/condiciones`, payload)
      .pipe(map(() => void 0));
  }

  // ── JointJS ────────────────────────────────────────────────────────────────

  /** Obtiene diagrama en formato JointJS (nodos + transiciones + datosDiagramaJson). */
  getDiagrama(politicaId: string): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${this.baseUrl}/${politicaId}/diagrama`)
      .pipe(map((res) => res.data ?? res));
  }

  /** Guarda diagrama en formato JointJS — llama a PUT /api/v1/politicas/{id}/diagrama. */
  guardarDiagramaJointJs(politicaId: string, payload: {
    datosDiagramaJson: string;
    nodos: Array<{
      id: null;
      tempId: string;
      tipo: string;
      nombre: string;
      departamentoId: string | null;
      formularioId: string | null;
      posicionX: number;
      posicionY: number;
    }>;
    transiciones: Array<{
      id: null;
      nodoOrigenTempId: string;
      nodoDestinoTempId: string;
      tipo: string;
      etiqueta: string | null;
      condicion: null;
    }>;
  }): Observable<any> {
    return this.http
      .put<ApiResponse<any>>(`${this.baseUrl}/${politicaId}/diagrama`, payload)
      .pipe(map((res) => res.data ?? res));
  }
}
