import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PageResponse } from '../models/page-response.model';
import { Usuario, UsuarioRequest, UsuarioUpdateRequest } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  list(page = 0, size = 10, departamentoId?: string, rol?: string, q?: string): Observable<PageResponse<Usuario>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (departamentoId) params.set('departamentoId', departamentoId);
    if (rol) params.set('rol', rol);
    if (q) params.set('q', q);

    return this.http
      .get<ApiResponse<PageResponse<Usuario>>>(`${this.baseUrl}?${params.toString()}`)
      .pipe(map((res) => res.data));
  }

  getById(id: string): Observable<Usuario> {
    return this.http.get<ApiResponse<Usuario>>(`${this.baseUrl}/${id}`).pipe(map((res) => res.data));
  }

  create(payload: UsuarioRequest): Observable<Usuario> {
    return this.http.post<ApiResponse<Usuario>>(this.baseUrl, payload).pipe(map((res) => res.data));
  }

  update(id: string, payload: UsuarioUpdateRequest): Observable<Usuario> {
    return this.http.put<ApiResponse<Usuario>>(`${this.baseUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(map(() => void 0));
  }
}
