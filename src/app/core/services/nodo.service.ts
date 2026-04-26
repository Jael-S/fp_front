import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Nodo, NodoRequest } from '../models/nodo.model';

@Injectable({ providedIn: 'root' })
export class NodoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/nodos`;

  listByPolitica(politicaId: string): Observable<Nodo[]> {
    const params = new HttpParams().set('politicaId', politicaId);
    return this.http.get<ApiResponse<Nodo[]>>(this.baseUrl, { params }).pipe(map((res) => res.data));
  }

  create(politicaId: string, payload: NodoRequest): Observable<Nodo> {
    const params = new HttpParams().set('politicaId', politicaId);
    return this.http.post<ApiResponse<Nodo>>(this.baseUrl, payload, { params }).pipe(map((res) => res.data));
  }

  update(id: string, payload: NodoRequest): Observable<Nodo> {
    return this.http.put<ApiResponse<Nodo>>(`${this.baseUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(map(() => void 0));
  }
}
