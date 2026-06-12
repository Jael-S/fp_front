import { TipoNodo, TipoTransicion } from './uml-shapes.constants';

export interface NodoEstado {
  tempId:          string;
  tipo:            TipoNodo;
  nombre:          string;
  departamentoId?: string | null;
  formularioId?:   string | null;
}

export interface TransicionEstado {
  nodoOrigenTempId:  string;
  nodoDestinoTempId: string;
  tipo:              TipoTransicion;
  etiqueta?:         string | null;
}

export interface ValidacionResultado {
  valido:      boolean;
  errores:     string[];
  advertencias: string[];
}

export function validarDiagrama(
  nodos: NodoEstado[],
  transiciones: TransicionEstado[],
): ValidacionResultado {
  const errores: string[]      = [];
  const advertencias: string[] = [];

  if (nodos.length === 0) {
    return { valido: false, errores: ['El diagrama no tiene nodos'], advertencias };
  }

  // ── Conteos básicos ───────────────────────────────────────────────────────
  const inicios   = nodos.filter(n => n.tipo === 'INICIO');
  const fines     = nodos.filter(n => n.tipo === 'FIN');
  const tareas    = nodos.filter(n => n.tipo === 'TAREA');
  const decisiones = nodos.filter(n => n.tipo === 'DECISION');

  if (inicios.length !== 1) errores.push(`Debe haber exactamente 1 nodo INICIO (hay ${inicios.length})`);
  if (fines.length < 1)     errores.push('Debe haber al menos 1 nodo FIN');
  if (tareas.length < 1)    errores.push('Debe haber al menos 1 nodo TAREA');

  // ── Tareas sin departamento ───────────────────────────────────────────────
  tareas.forEach(n => {
    if (!n.departamentoId) {
      errores.push(`La tarea "${n.nombre || n.tempId}" no tiene departamento asignado`);
    }
  });

  // ── Nodos sin nombre ─────────────────────────────────────────────────────
  nodos.filter(n => n.tipo === 'TAREA' && (!n.nombre || !n.nombre.trim())).forEach(() => {
    advertencias.push(`Un nodo TAREA no tiene nombre`);
  });

  // ── Decisiones con número incorrecto de salidas ALTERNATIVA ──────────────
  decisiones.forEach(d => {
    const salidas = transiciones.filter(
      t => t.nodoOrigenTempId === d.tempId && t.tipo === 'ALTERNATIVA',
    );
    if (salidas.length !== 2) {
      errores.push(
        `La decisión "${d.nombre || d.tempId}" debe tener exactamente 2 salidas ALTERNATIVA (tiene ${salidas.length})`,
      );
    }
    // Verificar etiquetas Aprobado / Rechazado
    const etiquetas = salidas.map(s => s.etiqueta?.trim() ?? '').filter(Boolean);
    if (etiquetas.length === 2) {
      const upper = etiquetas.map(e => e.toUpperCase());
      if (!upper.includes('APROBADO') && !upper.includes('RECHAZADO')) {
        advertencias.push(
          `La decisión "${d.nombre || d.tempId}" debería tener etiquetas "Aprobado" y "Rechazado"`,
        );
      }
    }
  });

  // ── Nodos sin conexiones de salida (excepto FIN) ──────────────────────────
  nodos.filter(n => n.tipo !== 'FIN').forEach(n => {
    const tieneSalida = transiciones.some(t => t.nodoOrigenTempId === n.tempId);
    if (!tieneSalida) {
      advertencias.push(`El nodo "${n.nombre || n.tipo}" no tiene ninguna conexión de salida`);
    }
  });

  // ── Camino válido INICIO → FIN (BFS simple) ───────────────────────────────
  const inicio = inicios[0];
  if (inicio) {
    const visitados = new Set<string>();
    const cola = [inicio.tempId];
    while (cola.length > 0) {
      const cur = cola.shift()!;
      visitados.add(cur);
      transiciones
        .filter(t => t.nodoOrigenTempId === cur)
        .forEach(t => { if (!visitados.has(t.nodoDestinoTempId)) cola.push(t.nodoDestinoTempId); });
    }
    const finAlcanzable = fines.some(f => visitados.has(f.tempId));
    if (!finAlcanzable && fines.length > 0) {
      errores.push('No existe un camino válido desde INICIO hasta ningún nodo FIN');
    }
  }

  return { valido: errores.length === 0, errores, advertencias };
}
