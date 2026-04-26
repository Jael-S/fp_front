export type TipoNodo = 'INICIO' | 'PROCESO' | 'DECISION' | 'FIN';

export interface Nodo {
  id: string;
  politicaId: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoNodo;
  formularioId?: string;
  posicionX?: number;
  posicionY?: number;
}

export interface NodoRequest {
  nombre: string;
  descripcion?: string;
  tipo: TipoNodo;
  formularioId?: string;
  posicionX?: number;
  posicionY?: number;
}
