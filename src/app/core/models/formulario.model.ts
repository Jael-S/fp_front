export type CampoTipo = 'TEXTO' | 'NUMERO' | 'FECHA' | 'SELECCION' | 'ARCHIVO' | 'IMAGEN';

export interface Campo {
  nombre: string;
  etiqueta: string;
  tipo: CampoTipo;
  requerido: boolean;
  opciones: string[];
}

export interface Formulario {
  id: string;
  politicaId: string;
  nodoId: string;
  nombre: string;
  campos: Campo[];
}

export interface FormularioRequest {
  politicaId: string;
  nodoId: string;
  nombre: string;
  campos: Campo[];
}
