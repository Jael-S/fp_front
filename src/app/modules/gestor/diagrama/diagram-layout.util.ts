import { LANE_WIDTH, LANE_GAP, LANE_HEADER, NODE_SIZE, TipoNodo } from './uml-shapes.constants';

export interface LayoutNodo {
  tempId:        string;
  tipo:          TipoNodo;
  departamentoId?: string | null;
}

export interface LayoutTransicion {
  nodoOrigenTempId:  string;
  nodoDestinoTempId: string;
}

export interface LayoutDept {
  id:     string;
  nombre: string;
}

export interface LayoutResultado {
  /** tempId → { x, y } */
  positions: Map<string, { x: number; y: number }>;
  /** Carriles ordenados: [{ deptId, nombre, x }] */
  lanes: Array<{ deptId: string; nombre: string; x: number }>;
  /** Altura total del canvas */
  canvasHeight: number;
}

const LEVEL_GAP = 140;
const NODE_MARGIN_Y = 32;

/**
 * Calcula posiciones de nodos usando un layout topológico por niveles.
 * Nodos sin departamento (INICIO, FIN, DECISION, FORK, JOIN) se posicionan
 * en el carril de su nodo adyacente o en el centro del canvas.
 */
export function calcularLayout(
  nodos: LayoutNodo[],
  transiciones: LayoutTransicion[],
  departamentos: LayoutDept[],
): LayoutResultado {
  const positions = new Map<string, { x: number; y: number }>();

  // ── 1. Orden topológico (Kahn) ────────────────────────────────────────────
  const adjOut = new Map<string, string[]>();
  const inDeg  = new Map<string, number>();
  nodos.forEach(n => { adjOut.set(n.tempId, []); inDeg.set(n.tempId, 0); });
  transiciones.forEach(t => {
    adjOut.get(t.nodoOrigenTempId)?.push(t.nodoDestinoTempId);
    inDeg.set(t.nodoDestinoTempId, (inDeg.get(t.nodoDestinoTempId) ?? 0) + 1);
  });

  const queue: string[] = [];
  inDeg.forEach((deg, id) => { if (deg === 0) queue.push(id); });

  const level = new Map<string, number>();
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const curLevel = level.get(cur) ?? 0;
    for (const next of (adjOut.get(cur) ?? [])) {
      level.set(next, Math.max(level.get(next) ?? 0, curLevel + 1));
      const newDeg = (inDeg.get(next) ?? 1) - 1;
      inDeg.set(next, newDeg);
      if (newDeg === 0) queue.push(next);
    }
  }
  // Nodos no alcanzados (ciclos) → nivel máximo + 1
  let maxLevel = 0;
  level.forEach(l => { if (l > maxLevel) maxLevel = l; });
  nodos.forEach(n => { if (!level.has(n.tempId)) level.set(n.tempId, maxLevel + 1); });

  // Forzar INICIO a nivel 0 y FIN al nivel máximo real para coherencia visual
  const nivelMaxReal = Math.max(0, ...Array.from(level.values()));
  nodos.forEach(n => {
    if (n.tipo === 'INICIO') level.set(n.tempId, 0);
    if (n.tipo === 'FIN')    level.set(n.tempId, nivelMaxReal);
  });

  // ── 2. Construir carriles ─────────────────────────────────────────────────
  // Ordenar departamentos según la frecuencia de uso
  const deptFreq = new Map<string, number>();
  nodos.forEach(n => {
    if (n.departamentoId) {
      deptFreq.set(n.departamentoId, (deptFreq.get(n.departamentoId) ?? 0) + 1);
    }
  });
  const deptsUsados = departamentos.filter(d => deptFreq.has(d.id));
  // Al menos un carril "General" si hay nodos sin depto
  const hasNodosGenerales = nodos.some(n => !n.departamentoId
    && n.tipo !== 'INICIO' && n.tipo !== 'FIN');

  const lanes: Array<{ deptId: string; nombre: string; x: number }> = [];
  let laneX = 0;
  if (hasNodosGenerales || deptsUsados.length === 0) {
    lanes.push({ deptId: '_general', nombre: 'General', x: laneX });
    laneX += LANE_WIDTH + LANE_GAP;
  }
  deptsUsados.forEach(d => {
    lanes.push({ deptId: d.id, nombre: d.nombre, x: laneX });
    laneX += LANE_WIDTH + LANE_GAP;
  });

  const laneByDept = new Map(lanes.map(l => [l.deptId, l]));

  // ── 3. Agrupar nodos por nivel y carril ──────────────────────────────────
  type LaneLevelKey = string; // `${laneIdx}-${level}`
  const slotsPerKey = new Map<LaneLevelKey, string[]>();

  const getLaneForNodo = (n: LayoutNodo): typeof lanes[0] => {
    if (n.departamentoId && laneByDept.has(n.departamentoId)) {
      return laneByDept.get(n.departamentoId)!;
    }
    // INICIO/FIN/DECISION/FORK/JOIN → centrar en canvas
    return lanes[Math.floor(lanes.length / 2)] ?? lanes[0];
  };

  nodos.forEach(n => {
    const lane = getLaneForNodo(n);
    const lv   = level.get(n.tempId) ?? 0;
    const key: LaneLevelKey = `${lane.deptId}-${lv}`;
    if (!slotsPerKey.has(key)) slotsPerKey.set(key, []);
    slotsPerKey.get(key)!.push(n.tempId);
  });

  // ── 4. Calcular posiciones ────────────────────────────────────────────────
  slotsPerKey.forEach((ids, key) => {
    const [deptId, lvStr] = key.split('-');
    const lv   = parseInt(lvStr, 10);
    const lane = laneByDept.get(deptId)!;
    ids.forEach((tempId, idx) => {
      const nodo  = nodos.find(n => n.tempId === tempId)!;
      const { width, height } = NODE_SIZE[nodo.tipo];
      const centerX = lane.x + LANE_WIDTH / 2;
      const x = centerX - width / 2;
      const y = LANE_HEADER + lv * LEVEL_GAP + idx * (Math.max(...Object.values(NODE_SIZE).map(s => s.height)) + NODE_MARGIN_Y);
      positions.set(tempId, { x, y });
    });
  });

  // ── 5. Centrar INICIO y FIN horizontalmente en el canvas completo ─────────
  if (lanes.length > 1) {
    const totalCanvasWidth = lanes[lanes.length - 1].x + LANE_WIDTH;
    nodos.forEach(n => {
      if (n.tipo === 'INICIO' || n.tipo === 'FIN') {
        const pos = positions.get(n.tempId);
        if (pos) {
          const { width } = NODE_SIZE[n.tipo];
          positions.set(n.tempId, {
            x: Math.round(totalCanvasWidth / 2 - width / 2),
            y: pos.y,
          });
        }
      }
    });
  }

  // ── 6. Calcular altura del canvas ─────────────────────────────────────────
  let maxY = 400;
  positions.forEach(({ y }) => { if (y > maxY) maxY = y; });
  const canvasHeight = maxY + 200;

  return { positions, lanes, canvasHeight };
}
