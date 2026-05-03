export type CampoTipo =
  | 'TEXTO'
  | 'AREA_TEXTO'
  | 'ETIQUETA'
  | 'NUMERO'
  | 'FECHA'
  | 'SELECCION'
  | 'RADIO'
  | 'CHECKBOX'
  | 'ARCHIVO'
  | 'IMAGEN'
  | 'TABLA';

export interface Campo {
  nombre: string;
  etiqueta: string;
  tipo: CampoTipo;
  requerido: boolean;
  opciones: string[];
  aceptaMultiples?: boolean;
  /** Solo para TABLA: número de filas */
  filasTabla?: number;
  /** Solo para TABLA: número de columnas */
  columnasTabla?: number;
  /** Solo para TABLA: nombres de las columnas */
  columnasNombres?: string[];
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
