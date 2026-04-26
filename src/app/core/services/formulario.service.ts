import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Formulario, FormularioRequest } from '../models/formulario.model';

@Injectable({ providedIn: 'root' })
export class FormularioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/formularios`;

  create(payload: FormularioRequest): Observable<Formulario> {
    return this.http.post<ApiResponse<Formulario>>(this.baseUrl, payload).pipe(map((res) => res.data));
  }

  getByNodoId(nodoId: string): Observable<Formulario[]> {
    return this.http.get<ApiResponse<Formulario[]>>(`${this.baseUrl}/nodo/${nodoId}`).pipe(map((res) => res.data));
  }

  update(id: string, payload: FormularioRequest): Observable<Formulario> {
    return this.http.put<ApiResponse<Formulario>>(`${this.baseUrl}/${id}`, payload).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(map(() => void 0));
  }
}
