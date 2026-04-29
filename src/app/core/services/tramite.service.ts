import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import { Tramite, TramiteCreateRequest, TramiteDetalle } from '../models/tramite.model';
import { Politica } from '../models/politica.model';

@Injectable({ providedIn: 'root' })
export class TramiteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tramites`;

  list(page = 0, size = 10, filters?: Record<string, string>): Observable<PageResponse<Tramite>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params = params.set(key, value);
      });
    }
    return this.http.get<ApiResponse<PageResponse<Tramite>>>(this.baseUrl, { params }).pipe(map((r) => r.data));
  }

  create(payload: TramiteCreateRequest): Observable<Tramite> {
    return this.http.post<ApiResponse<Tramite>>(this.baseUrl, payload).pipe(map((r) => r.data));
  }

  update(id: string, payload: TramiteCreateRequest): Observable<Tramite> {
    return this.http.put<ApiResponse<Tramite>>(`${this.baseUrl}/${id}`, payload).pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(map(() => void 0));
  }

  getById(id: string): Observable<TramiteDetalle> {
    return this.http.get<ApiResponse<TramiteDetalle>>(`${this.baseUrl}/${id}`).pipe(map((r) => r.data));
  }

  getDetalleCompleto(id: string): Observable<TramiteDetalle> {
    return this.http.get<ApiResponse<TramiteDetalle>>(`${this.baseUrl}/${id}/detalle-completo`).pipe(map((r) => r.data));
  }

  misTramites(page = 0, size = 10): Observable<PageResponse<Tramite>> {
    return this.http
      .get<ApiResponse<PageResponse<Tramite>>>(`${this.baseUrl}/mis-tramites?page=${page}&size=${size}`)
      .pipe(map((r) => r.data));
  }

  updateEstado(id: string, estado: string): Observable<Tramite> {
    return this.http.put<ApiResponse<Tramite>>(`${this.baseUrl}/${id}/estado`, { estado }).pipe(map((r) => r.data));
  }

  listPoliticasActivas(): Observable<Politica[]> {
    return this.http.get<ApiResponse<Politica[]>>(`${this.baseUrl}/politicas-activas`).pipe(map((r) => r.data));
  }

  monitorPolitica(politicaId: string): Observable<Record<string, unknown>> {
    return this.http
      .get<ApiResponse<Record<string, unknown>>>(`${this.baseUrl}/monitor/${politicaId}`)
      .pipe(map((r) => r.data));
  }
}
