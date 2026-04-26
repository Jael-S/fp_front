import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Ejecucion } from '../models/ejecucion.model';

@Injectable({ providedIn: 'root' })
export class EjecucionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ejecuciones`;

  pendientes(): Observable<Ejecucion[]> {
    return this.http.get<ApiResponse<Ejecucion[]>>(`${this.baseUrl}/pendientes`).pipe(map((r) => r.data));
  }

  iniciar(id: string): Observable<Ejecucion> {
    return this.http.put<ApiResponse<Ejecucion>>(`${this.baseUrl}/${id}/iniciar`, {}).pipe(map((r) => r.data));
  }

  completar(id: string, respuestas: Record<string, unknown>, files: File[]): Observable<Ejecucion> {
    const form = new FormData();
    form.append('respuestas', JSON.stringify(respuestas));
    files.forEach((f) => form.append('archivos', f));
    return this.http.put<ApiResponse<Ejecucion>>(`${this.baseUrl}/${id}/completar`, form).pipe(map((r) => r.data));
  }

  rechazar(id: string, observaciones: string): Observable<Ejecucion> {
    return this.http.put<ApiResponse<Ejecucion>>(`${this.baseUrl}/${id}/rechazar`, { observaciones }).pipe(map((r) => r.data));
  }
}
