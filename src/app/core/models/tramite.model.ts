export type EstadoTramite = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'RECHAZADO';

export interface Tramite {
  id: string;
  empresaId: string;
  departamentoId: string | null;
  politicaId: string;
  usuarioCreadorId: string;
  estado: EstadoTramite;
  nodoActualId: string;
  datos?: Record<string, unknown>;
  creadoEn: string;
  actualizadoEn: string;
}

export interface TramiteCreateRequest {
  politicaId: string;
  departamentoId?: string | null;
  datos?: Record<string, unknown>;
}
