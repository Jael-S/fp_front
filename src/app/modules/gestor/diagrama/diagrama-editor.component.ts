import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, inject, signal,
} from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as joint             from '@joint/core';
import { Client }             from '@stomp/stompjs';
import SockJS                 from 'sockjs-client';
import html2canvas            from 'html2canvas';
import { jsPDF }              from 'jspdf';
import { Subscription }       from 'rxjs';

import { environment }         from '../../../../environments/environment';
import { DepartamentoService } from '../../../core/services/departamento.service';
import { FormularioService }   from '../../../core/services/formulario.service';
import { IaService }           from '../../../core/services/ia.service';
import { PoliticaService }     from '../../../core/services/politica.service';
import { Departamento }        from '../../../core/models/departamento.model';
import { Formulario }          from '../../../core/models/formulario.model';
import {
  TipoNodo, TipoTransicion, LANE_WIDTH, LANE_GAP, LANE_HEADER,
  crearNodoShape, crearLink,
}                              from './uml-shapes.constants';
import { calcularLayout }      from './diagram-layout.util';
import {
  NodoEstado, TransicionEstado, validarDiagrama,
}                              from './diagram-validators';

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface LaneState {
  jointId:        string;
  departamentoId: string;
  nombre:         string;
  x:              number;
}

interface NodoLocal extends NodoEstado {
  jointId:   string;
  posicionX: number;
  posicionY: number;
}

interface TransicionLocal extends TransicionEstado {
  jointId: string;
}

type ModoModal = 'nodo' | 'ia' | null;

const MIN_LANE_HEIGHT = 620;

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-diagrama-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diagrama-editor.component.html',
  styleUrls: ['./diagrama-editor.component.scss'],
})
export class DiagramaEditorComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('canvasEl', { static: false }) canvasRef!: ElementRef<HTMLDivElement>;

  // ── Servicios ─────────────────────────────────────────────────────────────
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly deptoSvc       = inject(DepartamentoService);
  private readonly formularioSvc  = inject(FormularioService);
  private readonly iaSvc          = inject(IaService);
  private readonly politicaSvc    = inject(PoliticaService);

  // ── Estado ────────────────────────────────────────────────────────────────
  politicaId    = '';
  departamentos: Departamento[] = [];
  nodos:        NodoLocal[]     = [];
  transiciones: TransicionLocal[] = [];
  lanes:        LaneState[]     = [];

  // ── JointJS ──────────────────────────────────────────────────────────────
  private graph!: joint.dia.Graph;
  private paper!: joint.dia.Paper;
  private idMap      = new Map<string, string>();   // jointId → tempId
  private elementMap = new Map<string, joint.dia.Element>(); // tempId → element
  private tempCounter = 0;

  // ── Selección ─────────────────────────────────────────────────────────────
  selectedNodo:      NodoLocal       | null = null;
  selectedTransicion: TransicionLocal | null = null;

  // ── Formularios del nodo seleccionado ─────────────────────────────────────
  formularios = signal<Formulario[]>([]);

  // ── Canvas dinámico ──────────────────────────────────────────────────────
  private laneHeight  = MIN_LANE_HEIGHT;

  // ── Modales ───────────────────────────────────────────────────────────────
  modoModal           = signal<ModoModal>(null);
  modalNombre         = '';
  modalDepartamentoId = '';
  modalFormularioId   = '';
  iaDescripcion      = '';
  iaCargando         = signal(false);
  iaEscuchando       = signal(false);
  iaError            = '';
  private iaRecognition: any = null;

  // ── UI ────────────────────────────────────────────────────────────────────
  guardando           = signal(false);
  exportando          = signal(false);
  erroresValidacion:  string[] = [];
  advertenciasValidacion: string[] = [];
  mensajeGuardado     = '';

  // ── WebSocket ─────────────────────────────────────────────────────────────
  private stompClient?: Client;

  // ── Suscripciones ─────────────────────────────────────────────────────────
  private subs = new Subscription();

  // ──────────────────────────────────────────────────────────────────────────
  // Ciclo de vida
  // ──────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.politicaId = this.route.snapshot.paramMap.get('politicaId') ?? '';
    this.subs.add(
      this.deptoSvc.list(0, 100).subscribe(page => {
        this.departamentos = page.items;
        this.cargarDiagramaExistente();
      }),
    );
  }

  ngAfterViewInit(): void {
    this.initJointJs();
    this.conectarWebSocket();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.stompClient?.deactivate();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Inicialización JointJS
  // ──────────────────────────────────────────────────────────────────────────

  private initJointJs(): void {
    this.graph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });

    this.paper = new joint.dia.Paper({
      el:                 this.canvasRef.nativeElement,
      model:              this.graph,
      width:              '100%',
      height:             MIN_LANE_HEIGHT,
      gridSize:           10,
      drawGrid:           { name: 'dot', args: { color: '#d1d5db' } },
      background:         { color: '#f9fafb' },
      cellViewNamespace:  joint.shapes,
      defaultLink:        () => crearLink(),
      validateConnection: (sv, _sm, tv) => sv.model.id !== tv.model.id,
      // PROBLEMA 2: carriles no se pueden mover
      interactive: (cellView: joint.dia.CellView) =>
        (cellView.model as any).prop('esCarril') ? false : true,
    });

    this.paper.on('element:pointerclick',  (view)  => this.onElementClick(view));
    this.paper.on('link:connect',          (view)  => this.onLinkConnect(view as any));
    this.paper.on('link:pointerclick',     (view: joint.dia.LinkView) => {
      this.selectedNodo = null;
      const jointId = view.model.id as string;
      const found = this.transiciones.find(t => t.jointId === jointId);
      if (found) {
        this.selectedTransicion = found;
      } else {
        // Flecha sin registro en estado local (huérfana) → eliminarla al hacer clic
        view.model.remove();
        this.selectedTransicion = null;
      }
    });
    this.paper.on('blank:pointerclick',    ()      => {
      this.selectedNodo = null;
      this.selectedTransicion = null;
    });

    // PROBLEMA 3: puertos visibles solo en hover
    this.paper.on('element:mouseenter', (view: joint.dia.ElementView) => {
      if ((view.model as any).prop('esCarril')) return;
      view.model.getPorts().forEach((port: any) => {
        view.model.portProp(port.id, 'attrs/circle/visibility', 'visible');
      });
    });
    this.paper.on('element:mouseleave', (view: joint.dia.ElementView) => {
      if ((view.model as any).prop('esCarril')) return;
      view.model.getPorts().forEach((port: any) => {
        view.model.portProp(port.id, 'attrs/circle/visibility', 'hidden');
      });
    });

    // Eliminar flecha huérfana: usa el linkView del evento para actuar sobre el link exacto
    this.paper.on('link:pointerup', (linkView: joint.dia.LinkView) => {
      const link = linkView.model;
      const src  = link.get('source') as any;
      const tgt  = link.get('target') as any;
      if (!src?.id || !tgt?.id) {
        this.transiciones = this.transiciones.filter(t => t.jointId !== (link.id as string));
        link.remove();
      }
    });
    // Seguridad adicional: limpiar huérfanos cuando el usuario suelta sobre el canvas
    this.paper.on('blank:pointerup', () => {
      this.graph.getLinks().forEach(link => {
        const tgt = link.get('target') as any;
        if (!tgt?.id) {
          this.transiciones = this.transiciones.filter(t => t.jointId !== (link.id as string));
          link.remove();
        }
      });
    });

    this.canvasRef.nativeElement.addEventListener('dragover', e => e.preventDefault());
    this.canvasRef.nativeElement.addEventListener('drop',    e => this.onDrop(e));

    // Ctrl+Wheel → zoom; Wheel sin Ctrl → scroll nativo del contenedor
    this.canvasRef.nativeElement.addEventListener('wheel', (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const current  = this.paper.scale();
      const newScale = Math.max(0.3, Math.min(2.0, current.sx + (e.deltaY < 0 ? 0.1 : -0.1)));
      this.paper.scale(newScale, newScale);
    }, { passive: false });

    // Snap nodos dentro de su carril al mover
    this.graph.on('change:position', (cell: joint.dia.Cell) => {
      if (!cell.isElement() || (cell as any).prop('esCarril')) return;
      this.snapNodoEnCarril(cell as joint.dia.Element);
    });

    // Recalcular altura exacta al soltar el drag (una sola vez por interacción)
    this.paper.on('element:pointerup', (view: joint.dia.ElementView) => {
      if ((view.model as any).prop('esCarril')) return;
      this.recalcularAlturaCarriles();
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Gestión de carriles (swimlanes)
  // ──────────────────────────────────────────────────────────────────────────

  estaAgregado(deptId: string): boolean {
    return this.lanes.some(l => l.departamentoId === deptId);
  }

  agregarCarril(dept: Departamento): void {
    if (this.estaAgregado(dept.id)) return;
    this.insertarCarril(dept);
  }

  eliminarCarril(deptId: string): void {
    const lane = this.lanes.find(l => l.departamentoId === deptId);
    if (!lane) return;

    // tempIds de los nodos que están en este carril
    const tempIdsEnCarril = new Set(
      this.nodos.filter(n => n.departamentoId === deptId).map(n => n.tempId),
    );

    // Eliminar del graph: la célula del carril + nodos del carril (links se eliminan automáticamente)
    this.graph.getCells().forEach(c => {
      const esCelda = (c as any).prop('esCarril') && (c as any).prop('departamentoId') === deptId;
      const esNodo  = !!(this.idMap.get(c.id as string) && tempIdsEnCarril.has(this.idMap.get(c.id as string)!));
      if (esCelda || esNodo) c.remove();
    });

    // Limpiar estado local
    tempIdsEnCarril.forEach(tid => {
      const nodo = this.nodos.find(n => n.tempId === tid);
      if (nodo) this.idMap.delete(nodo.jointId);
      this.elementMap.delete(tid);
    });
    this.nodos        = this.nodos.filter(n => n.departamentoId !== deptId);
    this.transiciones = this.transiciones.filter(
      t => !tempIdsEnCarril.has(t.nodoOrigenTempId) && !tempIdsEnCarril.has(t.nodoDestinoTempId),
    );
    this.lanes = this.lanes.filter(l => l.departamentoId !== deptId);

    if (this.selectedNodo?.departamentoId === deptId) {
      this.selectedNodo = null;
      this.formularios.set([]);
    }
  }

  navegarACrearFormulario(): void {
    if (!this.selectedNodo) return;
    this.router.navigate(['/gestor/formularios'], {
      queryParams: {
        departamentoId: this.selectedNodo.departamentoId ?? '',
        politicaId:     this.politicaId,
      },
    });
  }

  private insertarCarril(dept: Departamento): void {
    const x = this.lanes.length * (LANE_WIDTH + LANE_GAP);
    const rect = new joint.shapes.standard.Rectangle();
    rect.resize(LANE_WIDTH, this.laneHeight);
    rect.position(x, 0);
    rect.prop('esCarril', true);
    rect.prop('departamentoId', dept.id);
    rect.set('z', -1);
    rect.attr({
      body:  { fill: 'rgba(239,246,255,0.4)', stroke: '#bfdbfe', strokeWidth: 1.5 },
      label: {
        text: dept.nombre,
        fill: '#1e40af',
        fontSize: 11,
        fontWeight: 700,
        textAnchor: 'middle',
        textVerticalAnchor: 'top',
        x: LANE_WIDTH / 2,
        y: 12,
        stroke: 'rgba(239,246,255,0.9)',
        strokeWidth: 6,
        paintOrder: 'stroke',
      },
    });
    this.graph.addCell(rect);
    this.lanes.push({ jointId: rect.id as string, departamentoId: dept.id, nombre: dept.nombre, x });
    const totalW = Math.max(this.lanes.length * (LANE_WIDTH + LANE_GAP), 900);
    this.paper.setDimensions(totalW, this.laneHeight);
  }

  private recalcularAlturaCarriles(): void {
    let maxBottom = MIN_LANE_HEIGHT;
    this.graph.getElements().forEach(el => {
      if ((el as any).prop('esCarril')) return;
      const pos  = el.position();
      const size = el.size();
      maxBottom = Math.max(maxBottom, pos.y + size.height + 100);
    });
    if (maxBottom <= this.laneHeight) return;
    this.laneHeight = maxBottom;
    this.graph.getElements().forEach(el => {
      if (!(el as any).prop('esCarril')) return;
      el.resize(LANE_WIDTH, this.laneHeight, { silent: true });
    });
    const totalW = Math.max(this.lanes.length * (LANE_WIDTH + LANE_GAP), 900);
    this.paper.setDimensions(totalW, this.laneHeight);
  }

  private findLaneByX(x: number): LaneState | null {
    return this.lanes.find(l => x >= l.x && x < l.x + LANE_WIDTH) ?? null;
  }

  private snapNodoEnCarril(el: joint.dia.Element): void {
    const pos  = el.position();
    const size = el.size();
    const lane = this.findLaneByX(pos.x + size.width / 2);
    if (!lane) return;

    const margin = 8;
    const newX = Math.max(lane.x + margin, Math.min(pos.x, lane.x + LANE_WIDTH - size.width - margin));
    const newY = Math.max(LANE_HEADER + margin, pos.y);

    if (newX !== pos.x || newY !== pos.y) {
      el.position(newX, newY, { silent: true });
    }

    // Expandir carriles si el nodo se acerca al borde inferior
    if (newY + size.height + 80 > this.laneHeight) {
      this.recalcularAlturaCarriles();
    }

    // Actualizar departamentoId en el nodo lógico
    const tempId = this.idMap.get(el.id as string);
    if (tempId) {
      const nodo = this.nodos.find(n => n.tempId === tempId);
      if (nodo) nodo.departamentoId = lane.departamentoId;
      if (this.selectedNodo?.tempId === tempId) {
        this.modalDepartamentoId = lane.departamentoId;
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Carga desde backend
  // ──────────────────────────────────────────────────────────────────────────

  private cargarDiagramaExistente(): void {
    if (!this.politicaId) return;
    this.subs.add(
      this.politicaSvc.getDiagrama(this.politicaId).subscribe({
        next: (resp: any) => {
          const nodos        = resp?.nodos        ?? resp?.data?.nodos        ?? [];
          const transiciones = resp?.transiciones ?? resp?.data?.transiciones ?? [];
          if (nodos.length > 0) this.reconstruirDesdeBackend(nodos, transiciones);
          // else: lienzo en blanco, usuario agrega carriles manualmente
        },
        error: () => { /* lienzo en blanco */ },
      }),
    );
  }

  private reconstruirDesdeBackend(nodosRaw: any[], transicionesRaw: any[]): void {
    this.nodos = [];
    this.transiciones = [];
    this.idMap.clear();
    this.elementMap.clear();
    this.graph.clear();
    this.lanes = [];

    // Reconstruir carriles en el mismo orden izquierda→derecha que tenían al guardar,
    // ordenando cada departamento por la posicionX mínima de sus nodos.
    const deptMinX = new Map<string, number>();
    nodosRaw.forEach((n: any) => {
      if (n.departamentoId) {
        const prev = deptMinX.get(n.departamentoId) ?? Infinity;
        deptMinX.set(n.departamentoId, Math.min(prev, n.posicionX ?? 100));
      }
    });
    Array.from(deptMinX.entries())
      .sort((a, b) => a[1] - b[1])
      .forEach(([deptId]) => {
        const dept = this.departamentos.find(d => d.id === deptId);
        if (dept) this.insertarCarril(dept);
      });

    const tempIdByRealId = new Map<string, string>();

    nodosRaw.forEach((n: any) => {
      const tempId = `node-${++this.tempCounter}`;
      tempIdByRealId.set(n.id, tempId);
      const tipo = (n.tipo ?? 'TAREA') as TipoNodo;
      const x = n.posicionX ?? 100;
      const y = n.posicionY ?? 150;
      const el = crearNodoShape(tipo, n.nombre ?? '', x, y);
      el.prop('tempId', tempId);
      this.graph.addCell(el);
      this.idMap.set(el.id as string, tempId);
      this.elementMap.set(tempId, el);
      this.nodos.push({ tempId, jointId: el.id as string, tipo, nombre: n.nombre ?? '',
                        departamentoId: n.departamentoId, formularioId: n.formularioId ?? null,
                        posicionX: x, posicionY: y });
    });

    transicionesRaw.forEach((t: any) => {
      const srcTemp = tempIdByRealId.get(t.nodoOrigenId);
      const tgtTemp = tempIdByRealId.get(t.nodoDestinoId);
      if (!srcTemp || !tgtTemp) return;
      const elSrc = this.elementMap.get(srcTemp);
      const elTgt = this.elementMap.get(tgtTemp);
      if (!elSrc || !elTgt) return;
      const tipo = (t.tipo ?? 'LINEAL') as TipoTransicion;
      const link = crearLink(t.etiqueta ?? undefined, tipo);
      link.source(elSrc);
      link.target(elTgt);
      this.graph.addCell(link);
      this.transiciones.push({ jointId: link.id as string, nodoOrigenTempId: srcTemp,
                                nodoDestinoTempId: tgtTemp, tipo, etiqueta: t.etiqueta });
    });
    this.recalcularAlturaCarriles();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Drag & Drop desde paleta
  // ──────────────────────────────────────────────────────────────────────────

  onDragStart(event: DragEvent, tipo: TipoNodo): void {
    event.dataTransfer!.setData('tipo', tipo);
  }

  private onDrop(event: DragEvent): void {
    event.preventDefault();
    const tipo = event.dataTransfer?.getData('tipo') as TipoNodo;
    if (!tipo) return;
    const rect  = this.canvasRef.nativeElement.getBoundingClientRect();
    const scale = this.paper.scale();
    const x = (event.clientX - rect.left) / scale.sx;
    const y = (event.clientY - rect.top)  / scale.sy;
    const lane = this.findLaneByX(x);
    if (!lane) return; // solo se puede soltar dentro de un carril
    this.agregarNodo(tipo, x, y, lane.departamentoId);
  }

  agregarNodo(tipo: TipoNodo, x = 100, y = 150, departamentoId: string | null = null): void {
    const tempId = `node-${++this.tempCounter}`;
    const nombre = tipo === 'INICIO' ? 'Inicio' : tipo === 'FIN' ? 'Fin' : '';
    const el = crearNodoShape(tipo, nombre, x, y);
    el.prop('tempId', tempId);
    this.graph.addCell(el);
    this.idMap.set(el.id as string, tempId);
    this.elementMap.set(tempId, el);
    this.nodos.push({ tempId, jointId: el.id as string, tipo, nombre,
                      departamentoId, formularioId: null, posicionX: x, posicionY: y });
    this.publicarEvento({ tipo: 'AGREGAR_NODO', tempId, tipoNodo: tipo });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Eventos del paper
  // ──────────────────────────────────────────────────────────────────────────

  private onElementClick(view: joint.dia.ElementView): void {
    if ((view.model as any).prop('esCarril')) return;
    const tempId = this.idMap.get(view.model.id as string);
    if (!tempId) return;
    this.selectedNodo       = this.nodos.find(n => n.tempId === tempId) ?? null;
    this.selectedTransicion = null;
    if (this.selectedNodo) {
      this.modalNombre         = this.selectedNodo.nombre;
      this.modalDepartamentoId = this.selectedNodo.departamentoId ?? '';
      this.modalFormularioId   = this.selectedNodo.formularioId  ?? '';
      if (this.selectedNodo.tipo === 'TAREA' && this.selectedNodo.departamentoId) {
        this.cargarFormularios(this.selectedNodo.departamentoId);
      } else {
        this.formularios.set([]);
      }
    }
  }

  private onLinkConnect(view: { model: joint.dia.Link }): void {
    const link  = view.model;
    const srcId = link.source().id as string;
    const tgtId = link.target().id as string;
    const srcT  = this.idMap.get(srcId);
    const tgtT  = this.idMap.get(tgtId);
    if (!srcT || !tgtT) return;

    const srcNodo = this.nodos.find(n => n.tempId === srcT);
    let tipo: TipoTransicion = 'LINEAL';
    let etiqueta: string | undefined;

    if (srcNodo?.tipo === 'DECISION') {
      tipo = 'ALTERNATIVA';
      // Contar cuántas ALTERNATIVA ya existen desde este DECISION
      const yaExistentes = this.transiciones.filter(
        t => t.nodoOrigenTempId === srcT && t.tipo === 'ALTERNATIVA',
      ).length;
      etiqueta = yaExistentes === 0 ? 'Aprobado' : yaExistentes === 1 ? 'Rechazado' : `Opción ${yaExistentes + 1}`;

      // Aplicar color y etiqueta visual al link
      link.attr('line/stroke', '#f59e0b');
      link.label(0, {
        attrs: {
          text: { text: etiqueta, fontSize: 11, fill: '#374151', fontWeight: '600' },
          rect: { fill: '#fff', stroke: '#e5e7eb', strokeWidth: 1, rx: 4, ry: 4 },
        },
        position: { distance: 0.5 },
      });
    } else if (srcNodo?.tipo === 'FORK' || srcNodo?.tipo === 'JOIN') {
      tipo = 'PARALELA';
      link.attr('line/stroke', '#8b5cf6');
    }

    this.transiciones.push({
      jointId: link.id as string,
      nodoOrigenTempId: srcT,
      nodoDestinoTempId: tgtT,
      tipo,
      etiqueta,
    });
    this.publicarEvento({ tipo: 'AGREGAR_TRANSICION', srcT, tgtT });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Modal nodo
  // ──────────────────────────────────────────────────────────────────────────

  abrirModalNodo(): void {
    if (this.selectedNodo) this.modoModal.set('nodo');
  }

  guardarModalNodo(): void {
    if (!this.selectedNodo) return;
    this.selectedNodo.nombre         = this.modalNombre;
    this.selectedNodo.departamentoId = this.modalDepartamentoId || null;
    this.selectedNodo.formularioId   = this.modalFormularioId   || null;
    const el = this.elementMap.get(this.selectedNodo.tempId);
    if (el) el.attr('label/text', this.modalNombre);
  }

  onDepartamentoChange(): void {
    this.guardarModalNodo();
    this.modalFormularioId = '';
    if (this.selectedNodo?.tipo === 'TAREA' && this.modalDepartamentoId) {
      this.cargarFormularios(this.modalDepartamentoId);
    } else {
      this.formularios.set([]);
    }
  }

  private cargarFormularios(departamentoId: string): void {
    this.subs.add(
      this.formularioSvc.list(departamentoId).subscribe({
        next: (list) => this.formularios.set(list ?? []),
        error: () => this.formularios.set([]),
      }),
    );
  }

  cerrarModal(): void { this.modoModal.set(null); }

  // Transición
  cambiarTipoTransicion(tipo: TipoTransicion): void {
    if (!this.selectedTransicion) return;
    this.selectedTransicion.tipo = tipo;
    const link = this.graph.getCell(this.selectedTransicion.jointId) as joint.dia.Link;
    if (link) {
      const col = tipo === 'ALTERNATIVA' ? '#f59e0b' : tipo === 'PARALELA' ? '#8b5cf6' : '#6b7280';
      link.attr('line/stroke', col);
    }
  }

  actualizarEtiqueta(etiqueta: string): void {
    if (!this.selectedTransicion) return;
    this.selectedTransicion.etiqueta = etiqueta;
    const link = this.graph.getCell(this.selectedTransicion.jointId) as joint.dia.Link;
    if (link && etiqueta) {
      link.label(0, {
        attrs: { text: { text: etiqueta, fontSize: 11, fill: '#374151', fontWeight: '600' },
                 rect: { fill: '#fff', stroke: '#e5e7eb', rx: 3, ry: 3 } },
        position: { distance: 0.5 },
      });
    }
  }

  eliminarSeleccionado(): void {
    if (this.selectedNodo) {
      this.elementMap.get(this.selectedNodo.tempId)?.remove();
      this.nodos        = this.nodos.filter(n => n.tempId !== this.selectedNodo!.tempId);
      this.transiciones = this.transiciones.filter(
        t => t.nodoOrigenTempId !== this.selectedNodo!.tempId
          && t.nodoDestinoTempId !== this.selectedNodo!.tempId,
      );
      this.idMap.delete(this.selectedNodo.jointId);
      this.elementMap.delete(this.selectedNodo.tempId);
      this.selectedNodo = null;
    } else if (this.selectedTransicion) {
      this.graph.getCell(this.selectedTransicion.jointId)?.remove();
      this.transiciones     = this.transiciones.filter(t => t.jointId !== this.selectedTransicion!.jointId);
      this.selectedTransicion = null;
    }
    this.publicarEvento({ tipo: 'ELIMINAR_NODO' });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // IA
  // ──────────────────────────────────────────────────────────────────────────

  abrirModalIa(): void { this.iaError = ''; this.modoModal.set('ia'); }

  iniciarGrabacionIa(): void {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      this.iaError = 'Tu navegador no soporta reconocimiento de voz. Usa Chrome.';
      return;
    }

    if (this.iaEscuchando()) {
      this.iaRecognition?.stop();
      return;
    }

    this.iaRecognition = new SpeechRecognitionCtor();
    this.iaRecognition.lang = 'es-ES';
    this.iaRecognition.continuous = true;
    this.iaRecognition.interimResults = true;

    this.iaEscuchando.set(true);

    this.iaRecognition.onresult = (event: any) => {
      let texto = '';
      for (let i = 0; i < event.results.length; i++) {
        texto += event.results[i][0].transcript;
      }
      this.iaDescripcion = texto;
    };

    this.iaRecognition.onerror = () => { this.iaEscuchando.set(false); };
    this.iaRecognition.onend   = () => { this.iaEscuchando.set(false); };

    this.iaRecognition.start();
  }

  generarConIa(): void {
    if (!this.iaDescripcion.trim()) return;
    this.iaCargando.set(true);
    this.iaError = '';
    const deptos = this.departamentos.map(d => ({ id: d.id, nombre: d.nombre }));
    this.subs.add(
      this.iaSvc.generarDiagramaJointJs(this.iaDescripcion, deptos).subscribe({
        next: (resp) => {
          console.log('[IA] Respuesta completa del backend:', resp);
          console.log('[IA] nodos recibidos:', resp.nodos);
          console.log('[IA] transiciones recibidas:', resp.transiciones);
          this.iaCargando.set(false);
          this.modoModal.set(null);
          this.reconstruirDesdeIa(resp.nodos ?? [], resp.transiciones ?? []);
          if (resp.advertencia) this.advertenciasValidacion = [resp.advertencia];
        },
        error: (err) => {
          console.error('[IA] Error al generar diagrama:', err);
          this.iaCargando.set(false);
          this.iaError = err?.error?.message ?? 'Error al generar diagrama con IA';
        },
      }),
    );
  }

  private reconstruirDesdeIa(nodosIa: any[], transicionesIa: any[]): void {
    console.log('[IA] reconstruirDesdeIa — nodos:', nodosIa.length, '| transiciones:', transicionesIa.length);
    this.nodos = [];
    this.transiciones = [];
    this.idMap.clear();
    this.elementMap.clear();
    this.graph.clear();
    this.lanes = [];

    const deptByNombre = new Map(this.departamentos.map(d => [d.nombre.toLowerCase(), d.id]));

    // Reconstruir carriles a partir de los departamentos en los nodos de IA
    const deptVistos = new Set<string>();
    nodosIa.forEach(n => {
      const deptoId = n.departamentoId ?? (n.departamento ? deptByNombre.get(n.departamento?.toLowerCase()) : null);
      if (deptoId && !deptVistos.has(deptoId)) {
        deptVistos.add(deptoId);
        const dept = this.departamentos.find(d => d.id === deptoId);
        if (dept) this.insertarCarril(dept);
      }
    });

    const layoutNodos = nodosIa.map(n => ({
      tempId: n.tempId,
      tipo: (n.tipo ?? 'TAREA') as TipoNodo,
      departamentoId: n.departamentoId ?? (n.departamento ? deptByNombre.get(n.departamento?.toLowerCase()) : null),
    }));
    const layout = calcularLayout(
      layoutNodos,
      transicionesIa.map(t => ({ nodoOrigenTempId: t.origen, nodoDestinoTempId: t.destino })),
      this.lanes.map(l => ({ id: l.departamentoId, nombre: l.nombre })),
    );

    nodosIa.forEach(n => {
      const tipo    = (n.tipo ?? 'TAREA') as TipoNodo;
      const deptoId = n.departamentoId ?? (n.departamento ? deptByNombre.get(n.departamento?.toLowerCase()) : null);
      const pos     = layout.positions.get(n.tempId) ?? { x: 100, y: 150 };
      const el      = crearNodoShape(tipo, n.nombre ?? '', pos.x, pos.y);
      el.prop('tempId', n.tempId);
      this.graph.addCell(el);
      this.idMap.set(el.id as string, n.tempId);
      this.elementMap.set(n.tempId, el);
      this.nodos.push({ tempId: n.tempId, jointId: el.id as string, tipo, nombre: n.nombre ?? '',
                        departamentoId: deptoId ?? null, formularioId: n.formularioId ?? null,
                        posicionX: pos.x, posicionY: pos.y });
    });

    transicionesIa.forEach(t => {
      console.log('[IA] transicion:', t.origen, '→', t.destino, '| src encontrado:', !!this.elementMap.get(t.origen), '| tgt encontrado:', !!this.elementMap.get(t.destino));
      const elSrc = this.elementMap.get(t.origen);
      const elTgt = this.elementMap.get(t.destino);
      if (!elSrc || !elTgt) return;
      const tipo = (t.tipo ?? 'LINEAL') as TipoTransicion;
      const link = crearLink(t.etiqueta ?? undefined, tipo);
      link.source(elSrc);
      link.target(elTgt);
      this.graph.addCell(link);
      this.transiciones.push({ jointId: link.id as string, nodoOrigenTempId: t.origen,
                                nodoDestinoTempId: t.destino, tipo, etiqueta: t.etiqueta });
    });
    this.recalcularAlturaCarriles();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Auto-layout
  // ──────────────────────────────────────────────────────────────────────────

  autoOrganizar(): void {
    const layout = calcularLayout(
      this.nodos.map(n => ({ tempId: n.tempId, tipo: n.tipo, departamentoId: n.departamentoId })),
      this.transiciones.map(t => ({ nodoOrigenTempId: t.nodoOrigenTempId, nodoDestinoTempId: t.nodoDestinoTempId })),
      this.lanes.map(l => ({ id: l.departamentoId, nombre: l.nombre })),
    );
    layout.positions.forEach(({ x, y }, tempId) => {
      const el = this.elementMap.get(tempId);
      if (el) el.position(x, y);
      const n = this.nodos.find(nn => nn.tempId === tempId);
      if (n) { n.posicionX = x; n.posicionY = y; }
    });
    this.recalcularAlturaCarriles();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Guardar
  // ──────────────────────────────────────────────────────────────────────────

  guardar(): void {
    // Sincronizar posiciones
    this.nodos.forEach(n => {
      const el = this.elementMap.get(n.tempId);
      if (el) { const p = el.position(); n.posicionX = p.x; n.posicionY = p.y; }
    });

    const resultado = validarDiagrama(this.nodos, this.transiciones);
    this.erroresValidacion     = resultado.errores;
    this.advertenciasValidacion = resultado.advertencias;
    if (!resultado.valido) return;

    this.guardando.set(true);
    const payload = {
      datosDiagramaJson: JSON.stringify(this.graph.toJSON()),
      nodos: this.nodos.map(n => ({
        id: null, tempId: n.tempId, tipo: n.tipo, nombre: n.nombre,
        departamentoId: n.departamentoId ?? null, formularioId: n.formularioId ?? null,
        posicionX: n.posicionX, posicionY: n.posicionY,
      })),
      transiciones: this.transiciones.map(t => ({
        id: null, nodoOrigenTempId: t.nodoOrigenTempId, nodoDestinoTempId: t.nodoDestinoTempId,
        tipo: t.tipo, etiqueta: t.etiqueta ?? null, condicion: null,
      })),
    };

    this.subs.add(
      this.politicaSvc.guardarDiagramaJointJs(this.politicaId, payload).subscribe({
        next: () => {
          this.guardando.set(false);
          this.mensajeGuardado = 'Diagrama guardado';
          setTimeout(() => (this.mensajeGuardado = ''), 3000);
        },
        error: (err) => {
          this.guardando.set(false);
          this.erroresValidacion = [err?.error?.message ?? 'Error al guardar'];
        },
      }),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Exportación
  // ──────────────────────────────────────────────────────────────────────────

  async exportarPng(): Promise<void> {
    this.exportando.set(true);
    const c = await html2canvas(this.canvasRef.nativeElement);
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = `diagrama-${this.politicaId}.png`;
    a.click();
    this.exportando.set(false);
  }

  async exportarPdf(): Promise<void> {
    this.exportando.set(true);
    const c   = await html2canvas(this.canvasRef.nativeElement);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [c.width, c.height] });
    pdf.addImage(c.toDataURL('image/png'), 'PNG', 0, 0, c.width, c.height);
    pdf.save(`diagrama-${this.politicaId}.pdf`);
    this.exportando.set(false);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // WebSocket
  // ──────────────────────────────────────────────────────────────────────────

  private conectarWebSocket(): void {
    const token = localStorage.getItem('token') ?? '';
    this.stompClient = new Client({
      webSocketFactory:  () => new SockJS(environment.wsUrl),
      connectHeaders:    { Authorization: `Bearer ${token}` },
      reconnectDelay:    5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
    this.stompClient.onConnect = () => {
      this.stompClient!.subscribe(`/topic/diagrama/${this.politicaId}`, (msg) => {
        try {
          const ev = JSON.parse(msg.body);
          if (ev.tipo === 'DIAGRAMA_GUARDADO') this.cargarDiagramaExistente();
        } catch { /* ignorar */ }
      });
    };
    this.stompClient.activate();
  }

  private publicarEvento(evento: object): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: `/app/diagrama/${this.politicaId}/evento`,
        body:        JSON.stringify(evento),
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers de template
  // ──────────────────────────────────────────────────────────────────────────

  readonly tiposNodo: TipoNodo[] = ['INICIO', 'TAREA', 'DECISION', 'FIN', 'FORK', 'JOIN'];
  readonly tiposTransicion: TipoTransicion[] = ['LINEAL', 'ALTERNATIVA', 'PARALELA'];

  nombreTipo(tipo: TipoNodo): string {
    const m: Record<TipoNodo, string> = {
      INICIO: 'Inicio', TAREA: 'Tarea', DECISION: 'Decisión',
      FIN: 'Fin', FORK: 'Fork (paralelo)', JOIN: 'Join (paralelo)',
    };
    return m[tipo];
  }

  getDeptNombre(id: string | null | undefined): string {
    if (!id) return '—';
    return this.departamentos.find(d => d.id === id)?.nombre ?? id;
  }
}
