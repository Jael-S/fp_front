import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  InterpretarReporteResponse,
  GenerarReportePantallaResponse,
  ReporteCriterios,
} from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reportes`;

  /** Interpreta una instrucción en lenguaje natural y extrae datos, criterios y formato. */
  interpretar(instruccion: string): Observable<InterpretarReporteResponse> {
    return this.http
      .post<ApiResponse<InterpretarReporteResponse>>(`${this.baseUrl}/interpretar`, { instruccion })
      .pipe(map((r) => r.data));
  }

  /** Genera el reporte en pantalla (formato "pantalla"). */
  generarEnPantalla(
    datos: string[],
    criterios: ReporteCriterios,
    formato: string,
  ): Observable<GenerarReportePantallaResponse> {
    return this.http
      .post<ApiResponse<GenerarReportePantallaResponse>>(`${this.baseUrl}/generar`, { datos, criterios, formato })
      .pipe(map((r) => r.data));
  }

  /** Genera el reporte como archivo descargable (excel/word/pdf). */
  generarArchivo(datos: string[], criterios: ReporteCriterios, formato: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/generar`, { datos, criterios, formato }, { responseType: 'blob' });
  }
}
