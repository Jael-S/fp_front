import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import { Notificacion } from '../models/notificacion.model';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notificaciones`;

  list(page = 0, size = 20): Observable<PageResponse<Notificacion>> {
    return this.http.get<ApiResponse<PageResponse<Notificacion>>>(`${this.baseUrl}?page=${page}&size=${size}`).pipe(map((r) => r.data));
  }

  countNoLeidas(): Observable<number> {
    return this.http.get<ApiResponse<{ totalNoLeidas: number }>>(`${this.baseUrl}/no-leidas/count`).pipe(map((r) => r.data.totalNoLeidas));
  }

  read(id: string): Observable<void> {
    return this.http.put<ApiResponse<unknown>>(`${this.baseUrl}/${id}/leer`, {}).pipe(map(() => void 0));
  }

  readAll(): Observable<void> {
    return this.http.put<ApiResponse<unknown>>(`${this.baseUrl}/leer-todas`, {}).pipe(map(() => void 0));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/${id}`).pipe(map(() => void 0));
  }
}
