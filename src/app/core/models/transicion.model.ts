export interface Transicion {
  id: string;
  politicaId: string;
  nodoOrigenId: string;
  nodoDestinoId: string;
  nombre?: string;
  descripcion?: string;
  condicion?: string;
  tipo?: string | null;
  etiqueta?: string | null;
  requiereAprobacion: boolean;
}

export interface TransicionRequest {
  nodoOrigenId: string;
  nodoDestinoId: string;
  nombre?: string;
  descripcion?: string;
  condicion?: string;
  requiereAprobacion?: boolean;
  tipo?: string | null;
  etiqueta?: string | null;
}
