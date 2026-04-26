import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import { Departamento, DepartamentoRequest } from '../models/departamento.model';

@Injectable({ providedIn: 'root' })
export class DepartamentoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/departamentos`;

  list(page = 0, size = 10): Observable<PageResponse<Departamento>> {
    return this.http
      .get<ApiResponse<PageResponse<Departamento>>>(`${this.baseUrl}?page=${page}&size=${size}`)
      .pipe(map((res) => res.data));
  }

  create(payload: DepartamentoRequest): Observable<Departamento> {
    return this.http.post<ApiResponse<Departamento>>(this.baseUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: DepartamentoRequest): Observable<Departamento> {
    return this.http.put<ApiResponse<Departamento>>(`${this.baseUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(map(() => void 0));
  }
}
