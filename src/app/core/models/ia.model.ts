export interface IaResponse {
  respuesta: string;
  metricas: Record<string, unknown>;
  generadoEn: string;
}

export interface GenerarDiagramaResponse {
  diagramaXml: string;
  tareasDetectadas: string[];
}

// ── Formato JointJS (nuevo editor) ───────────────────────────────────────────
export interface NodoDiagramaIa {
  tempId:          string;
  tipo:            string;
  nombre:          string;
  departamento?:   string | null;
  departamentoId?: string | null;
}

export interface TransicionDiagramaIa {
  origen:    string;
  destino:   string;
  tipo:      string;
  etiqueta?: string | null;
}

export interface GenerarDiagramaJointJsResponse {
  nodos:        NodoDiagramaIa[];
  transiciones: TransicionDiagramaIa[];
  advertencia?: string | null;
  metodo_usado?: string | null;
}

export interface NodoCuello {
  nodoId: string;
  nombre: string;
  tiempoPromedioMinutos: number;
  tramitesEjecutados: number;
  nivelRiesgo: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
  sugerencias: string[];
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
