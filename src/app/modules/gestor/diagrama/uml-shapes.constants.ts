import * as joint from '@joint/core';

export type TipoNodo = 'INICIO' | 'TAREA' | 'DECISION' | 'FIN' | 'FORK' | 'JOIN';
export type TipoTransicion = 'LINEAL' | 'ALTERNATIVA' | 'PARALELA';

export const LANE_WIDTH  = 280;
export const LANE_GAP    = 20;
export const LANE_HEADER = 40;

export const NODE_SIZE: Record<TipoNodo, { width: number; height: number }> = {
  INICIO:   { width: 40,  height: 40  },
  TAREA:    { width: 170, height: 64  },
  DECISION: { width: 86,  height: 86  },
  FIN:      { width: 40,  height: 40  },
  FORK:     { width: 150, height: 12  },
  JOIN:     { width: 150, height: 12  },
};

const PORTS_DEF = {
  groups: {
    in: {
      position: { name: 'absolute' },
      // visibility: hidden por defecto — se muestra en element:mouseenter
      attrs: { circle: { r: 5, magnet: true, fill: '#fff', stroke: '#6b7280', strokeWidth: 1.5, visibility: 'hidden' } },
    },
    out: {
      position: { name: 'absolute' },
      attrs: { circle: { r: 5, magnet: true, fill: '#3b82f6', stroke: '#1d4ed8', strokeWidth: 1.5, visibility: 'hidden' } },
    },
  },
  items: [
    { id: 'top',         group: 'in',  args: { x: '50%', y: 0    } },
    { id: 'bottom',      group: 'out', args: { x: '50%', y: '100%' } },
    { id: 'left',        group: 'in',  args: { x: 0,     y: '50%' } },
    { id: 'right',       group: 'out', args: { x: '100%',y: '50%' } },
    { id: 'topLeft',     group: 'in',  args: { x: '25%', y: 0    } },
    { id: 'topRight',    group: 'in',  args: { x: '75%', y: 0    } },
    { id: 'bottomLeft',  group: 'out', args: { x: '25%', y: '100%' } },
    { id: 'bottomRight', group: 'out', args: { x: '75%', y: '100%' } },
  ],
};


export function crearNodoShape(tipo: TipoNodo, nombre: string, x: number, y: number): joint.dia.Element {
  const { width, height } = NODE_SIZE[tipo];

  switch (tipo) {
    case 'INICIO': {
      const el = new joint.shapes.standard.Circle();
      el.resize(width, height);
      el.position(x, y);
      el.attr({
        body:  { fill: '#16a34a', stroke: '#14532d', strokeWidth: 2 },
        label: { text: '', fill: '#fff', fontSize: 10 },
      });
      (el as any).prop('ports', PORTS_DEF);
      return el;
    }

    case 'FIN': {
      const el = new joint.shapes.standard.Circle();
      el.resize(width, height);
      el.position(x, y);
      el.attr({
        body:  { fill: '#fff', stroke: '#dc2626', strokeWidth: 4 },
        label: { text: '', fill: '#dc2626', fontSize: 10 },
      });
      (el as any).prop('ports', PORTS_DEF);
      return el;
    }

    case 'TAREA': {
      const el = new joint.shapes.standard.Rectangle();
      el.resize(width, height);
      el.position(x, y);
      el.attr({
        body:  { fill: '#eff6ff', stroke: '#93c5fd', strokeWidth: 1.5, rx: 8, ry: 8 },
        label: { text: nombre, fill: '#1e3a5f', fontSize: 12, fontWeight: '600',
                 textWrap: { width: width - 20, height: height - 12, ellipsis: true } },
      });
      (el as any).prop('ports', PORTS_DEF);
      return el;
    }

    case 'DECISION': {
      const el = new joint.shapes.standard.Polygon();
      el.resize(width, height);
      el.position(x, y);
      el.attr({
        body:  { fill: '#fefce8', stroke: '#fbbf24', strokeWidth: 2,
                 points: '43,0 86,43 43,86 0,43' },
        label: { text: nombre, fill: '#78350f', fontSize: 10, fontWeight: '600',
                 textWrap: { width: 60, height: 40, ellipsis: true } },
      });
      (el as any).prop('ports', PORTS_DEF);
      return el;
    }

    case 'FORK':
    case 'JOIN': {
      const el = new joint.shapes.standard.Rectangle();
      el.resize(width, height);
      el.position(x, y);
      el.attr({
        body:  { fill: '#111827', stroke: '#111827', strokeWidth: 1 },
        label: { text: tipo, fill: '#fff', fontSize: 8 },
      });
      (el as any).prop('ports', PORTS_DEF);
      return el;
    }
  }
}

export function crearLink(etiqueta?: string, tipo: TipoTransicion = 'LINEAL'): joint.shapes.standard.Link {
  const link = new joint.shapes.standard.Link();
  link.attr({
    line: {
      stroke: tipo === 'ALTERNATIVA' ? '#f59e0b' : tipo === 'PARALELA' ? '#8b5cf6' : '#6b7280',
      strokeWidth: 2,
      targetMarker: { type: 'path', d: 'M 10 -5 0 0 10 5 Z', fill: '#6b7280' },
    },
  });
  link.router('normal');
  link.connector('rounded', { radius: 10 });
  if (etiqueta) {
    link.label(0, {
      attrs: {
        text:  { text: etiqueta, fontSize: 11, fill: '#374151', fontWeight: '600' },
        rect:  { fill: '#fff', stroke: '#e5e7eb', strokeWidth: 1, rx: 3, ry: 3 },
      },
      position: { distance: 0.5 },
    });
  }
  return link;
}
