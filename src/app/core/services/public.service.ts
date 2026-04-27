import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class PublicService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/public`;

  seguimiento(codigo: string): Observable<Record<string, unknown>> {
    return this.http
      .get<ApiResponse<Record<string, unknown>>>(`${this.baseUrl}/seguimiento/${encodeURIComponent(codigo)}`)
      .pipe(map((r) => r.data));
  }
}
