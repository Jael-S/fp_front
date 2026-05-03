export interface IaResponse {
  respuesta: string;
  metricas: Record<string, unknown>;
  generadoEn: string;
}

export interface GenerarDiagramaResponse {
  diagramaXml: string;
  tareasDetectadas: string[];
}

export interface NodoCuello {
  nodoId: string;
  nombre: string;
  tiempoPromedioMinutos: number;
  tramitesEjecutados: number;
  nivelRiesgo: 'ALTO' | 'MEDIO' | 'BAJO';
  sugerencia: string;
}

export interface CuelloBotellaResponse {
  nodosCriticos: NodoCuello[];
  tiempoPromedioGlobalMinutos: number;
  analisisGeneral: string;
}

export interface CampoIa {
  nombre: string;
  etiqueta: string;
  tipo: string;
  requerido: boolean;
  esCampoPrioridad: boolean;
  opciones: string[];
  filasTabla?: number;
  columnasTabla?: number;
  columnasNombres?: string[];
}

export interface GenerarFormularioResponse {
  campos: CampoIa[];
}
