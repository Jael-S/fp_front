import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PuntoCobertura } from '../models/cobertura.model';

@Injectable({ providedIn: 'root' })
export class CoberturaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/cobertura`;

  list(): Observable<PuntoCobertura[]> {
    return this.http
      .get<ApiResponse<PuntoCobertura[]>>(this.baseUrl)
      .pipe(map((response) => response.data));
  }
}
