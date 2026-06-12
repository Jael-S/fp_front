import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DocumentoResponse {
  id: string;
  empresaId?: string;
  nombre: string;
  descripcion?: string;
  tipoMime?: string;
  urlArchivo: string;
  s3Key?: string;
  tamanioBytes?: number;
  carpetaId?: string;
  politicaId?: string;
  tramiteId?: string;
  etiquetas?: string[];
  version: number;
  historialVersiones?: any[];
  permisos?: any;
  creadoPorId?: string;
  creadoPorNombre?: string;
  creadoEn?: string;
  modificadoEn?: string;
  esDocumentoOficina?: boolean;
  tipoDocumento?: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentoService {
  private base = `${environment.apiUrl}/documentos`;

  constructor(private http: HttpClient) {}

  listar(
    empresaId: string,
    params?: { carpetaId?: string; politicaId?: string; tramiteId?: string }
  ): Observable<DocumentoResponse[]> {
    let p = new HttpParams().set('empresaId', empresaId);
    if (params?.carpetaId)  p = p.set('carpetaId',  params.carpetaId);
    if (params?.politicaId) p = p.set('politicaId', params.politicaId);
    if (params?.tramiteId)  p = p.set('tramiteId',  params.tramiteId);
    return this.http.get<DocumentoResponse[]>(this.base, { params: p });
  }

  listarOficina(): Observable<DocumentoResponse[]> {
    return this.http.get<DocumentoResponse[]>(`${this.base}/oficina`);
  }

  subir(archivo: File, datos: Partial<DocumentoResponse> & { empresaId: string }): Observable<DocumentoResponse> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    return this.http.post<DocumentoResponse>(`${this.base}/upload`, formData);
  }

  subirNuevaVersion(id: string, archivo: File): Observable<DocumentoResponse> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<DocumentoResponse>(`${this.base}/${id}/version`, formData);
  }

  obtenerAuditoria(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/${id}/auditoria`);
  }

  eliminarDocumento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  generarUrlPresignada(key: string, minutos: number = 60): Observable<{ url: string; key: string }> {
    return this.http.get<{ url: string; key: string }>(`${this.base}/presignado`, {
      params: { key, minutos: String(minutos) }
    });
  }

  listarArchivosTramite(tramiteId: string, empresaId: string): Observable<Record<string, string[]>> {
    return this.http.get<Record<string, string[]>>(
      `${environment.apiUrl}/tramites/${tramiteId}/archivos-s3`,
      { params: { empresaId } }
    );
  }

  crearDocumentoOficina(nombre: string, tipo: string): Observable<DocumentoResponse> {
    return this.http.post<DocumentoResponse>(`${this.base}/crear-oficina`, { nombre, tipo });
  }

  obtenerConfigOnlyOffice(documentoId: string, modo: string = 'edit'): Observable<any> {
    return this.http.get<any>(`${this.base}/${documentoId}/onlyoffice-config`, { params: { modo } });
  }
}
