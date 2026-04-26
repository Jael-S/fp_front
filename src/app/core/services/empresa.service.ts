import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Empresa, EmpresaRequest } from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/empresas`;

  list(): Observable<Empresa[]> {
    return this.http.get<ApiResponse<Empresa[]>>(this.baseUrl).pipe(map((res) => res.data));
  }

  getById(id: string): Observable<Empresa> {
    return this.http.get<ApiResponse<Empresa>>(`${this.baseUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: EmpresaRequest): Observable<Empresa> {
    return this.http.post<ApiResponse<Empresa>>(this.baseUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: EmpresaRequest): Observable<Empresa> {
    return this.http.put<ApiResponse<Empresa>>(`${this.baseUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(map(() => void 0));
  }
}
