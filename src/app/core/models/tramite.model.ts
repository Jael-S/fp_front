export type EstadoTramite = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'RECHAZADO' | 'CANCELADO';
export type PrioridadTramite = 'ALTA' | 'MEDIA' | 'BAJA';

export interface EventoTramite {
  fecha: string;
  nodoNombre?: string | null;
  departamentoNombre?: string | null;
  completado?: boolean | null;
  evento: string;
  usuarioId: string;
  detalles?: Record<string, unknown>;
}

export interface Tramite {
  id: string;
  empresaId: string;
  departamentoId: string | null;
  politicaId: string;
  titulo: string;
  prioridad: PrioridadTramite;
  fechaLimite: string | null;
  usuarioCreadorId: string;
  creadoPorNombre: string | null;
  estado: EstadoTramite;
  nodoActualId: string;
  departamentoActualId: string | null;
  clienteNombre?: string | null;
  clienteIdentidad?: string | null;
  clienteEmail?: string | null;
  codigoSeguimiento?: string | null;
  datos?: Record<string, unknown>;
  creadoEn: string;
  actualizadoEn: string;
}

export interface TramiteCreateRequest {
  politicaId: string;
  titulo: string;
  prioridad: PrioridadTramite;
  fechaLimite: string;
  clienteNombre?: string | null;
  clienteIdentidad?: string | null;
  clienteEmail?: string | null;
  codigoSeguimiento?: string | null;
  departamentoId?: string | null;
  datos?: Record<string, unknown>;
}

export interface TramiteDetalle {
  tramite: Tramite;
  historial: EventoTramite[];
}
