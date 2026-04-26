export type EstadoPolitica = 'BORRADOR' | 'ACTIVA' | 'INACTIVA';

export interface Politica {
  id: string;
  empresaId: string;
  nombre: string;
  descripcion: string;
  version: number;
  estado: EstadoPolitica;
  creadoPor: string;
  diagramaJson: string | null;
}

export interface PoliticaRequest {
  nombre: string;
  descripcion: string;
  diagramaJson: string | null;
}
