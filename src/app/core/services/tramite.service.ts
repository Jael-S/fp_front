import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import { Tramite, TramiteCreateRequest } from '../models/tramite.model';

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

  getById(id: string): Observable<{ tramite: Tramite; historial: unknown[] }> {
    return this.http.get<ApiResponse<{ tramite: Tramite; historial: unknown[] }>>(`${this.baseUrl}/${id}`).pipe(map((r) => r.data));
  }

  misTramites(page = 0, size = 10): Observable<PageResponse<Tramite>> {
    return this.http
      .get<ApiResponse<PageResponse<Tramite>>>(`${this.baseUrl}/mis-tramites?page=${page}&size=${size}`)
      .pipe(map((r) => r.data));
  }
}
