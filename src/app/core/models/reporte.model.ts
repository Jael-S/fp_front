export interface ReporteCriterios {
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  politica?: string;
  departamento?: string;
  [key: string]: string | undefined;
}

export interface InterpretarReporteResponse {
  datos: string[];
  criterios: ReporteCriterios;
  formato: 'excel' | 'word' | 'pdf' | 'pantalla';
  pregunta: string | null;
}

export interface GenerarReportePantallaResponse {
  registros: Record<string, unknown>[];
  columnas: string[];
  etiquetas: Record<string, string>;
  advertencia?: string | null;
}

export interface ReporteHistorialItem {
  fecha: string;
  instruccion: string;
  formato: 'excel' | 'word' | 'pdf' | 'pantalla';
  datos: string[];
  criterios: ReporteCriterios;
}
