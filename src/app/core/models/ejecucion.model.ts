export interface Ejecucion {
  id: string;
  tramiteId: string;
  nodoId: string;
  usuarioAsignadoId: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'RECHAZADO';
  inicioEjecucion?: string | null;
  finEjecucion?: string | null;
  duracionMs?: number | null;
  respuestasFormulario?: Record<string, unknown> | null;
  adjuntos?: string[] | null;
  observaciones?: string | null;
}
