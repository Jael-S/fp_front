import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Transicion, TransicionRequest } from '../models/transicion.model';

@Injectable({ providedIn: 'root' })
export class TransicionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/transiciones`;

  listByPolitica(politicaId: string): Observable<Transicion[]> {
    const params = new HttpParams().set('politicaId', politicaId);
    return this.http.get<ApiResponse<Transicion[]>>(this.baseUrl, { params }).pipe(map((res) => res.data));
  }

  create(politicaId: string, payload: TransicionRequest): Observable<Transicion> {
    const params = new HttpParams().set('politicaId', politicaId);
    return this.http.post<ApiResponse<Transicion>>(this.baseUrl, payload, { params }).pipe(map((res) => res.data));
  }

  update(id: string, payload: TransicionRequest): Observable<Transicion> {
    return this.http.put<ApiResponse<Transicion>>(`${this.baseUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(map(() => void 0));
  }
}
