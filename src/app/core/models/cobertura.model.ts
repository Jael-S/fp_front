export interface PuntoCobertura {
  id: string;
  empresaId: string;
  departamentoId: string | null;
  nombre: string;
  tipo: string;
  latitud: number;
  longitud: number;
  metadata?: Record<string, unknown>;
}
