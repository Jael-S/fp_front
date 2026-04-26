import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { IaResponse } from '../models/ia.model';

@Injectable({ providedIn: 'root' })
export class IaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ia`;

  preguntar(pregunta: string): Observable<IaResponse> {
    return this.http
      .post<ApiResponse<IaResponse>>(`${this.baseUrl}/preguntar`, { pregunta })
      .pipe(map((response) => response.data));
  }
}
