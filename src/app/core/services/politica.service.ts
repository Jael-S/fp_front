import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import { EstadoPolitica, Politica, PoliticaRequest } from '../models/politica.model';

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
}
