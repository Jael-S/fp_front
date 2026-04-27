export type CampoTipo = 'TEXTO' | 'NUMERO' | 'FECHA' | 'SELECCION' | 'CHECKBOX' | 'ARCHIVO' | 'IMAGEN';

export interface Campo {
  nombre: string;
  etiqueta: string;
  tipo: CampoTipo;
  requerido: boolean;
  opciones: string[];
  aceptaMultiples?: boolean;
}

export interface Formulario {
  id: string;
  politicaId: string | null;
  nodoId: string | null;
  nombre: string;
  descripcion: string | null;
  departamentoId: string | null;
  campos: Campo[];
}

export interface FormularioRequest {
  politicaId?: string | null;
  nodoId?: string | null;
  nombre: string;
  descripcion?: string | null;
  departamentoId: string;
  campos: Campo[];
}
