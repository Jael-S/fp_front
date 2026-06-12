export interface Ejecucion {
  id: string;
  tramiteId: string;
  tramiteTitulo?: string | null;
  nodoId: string;
  nodoNombre?: string | null;
  nodoTipo?: string | null;
  departamentoId?: string | null;
  departamentoNombre?: string | null;
  usuarioAsignadoId: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'RECHAZADO';
  inicioEjecucion?: string | null;
  finEjecucion?: string | null;
  duracionMs?: number | null;
  respuestasFormulario?: Record<string, unknown> | null;
  adjuntos?: string[] | null;
  observaciones?: string | null;
  adjuntosCliente?: string[] | null;
}
