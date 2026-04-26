import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import jsPDF from 'jspdf';
import { DepartamentoService } from '../../../core/services/departamento.service';
import type { Departamento } from '../../../core/models/departamento.model';
import { PoliticaService } from '../../../core/services/politica.service';
import type { Politica } from '../../../core/models/politica.model';

@Component({
  selector: 'app-diagrama-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagrama-editor.component.html',
  styleUrl: './diagrama-editor.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DiagramaEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly departamentoService = inject(DepartamentoService);
  private readonly politicaService = inject(PoliticaService);

  private modeler: BpmnModeler | null = null;
  private laneOverlayByElement = new Map<string, string>();
  private laneTitleOverlayByElement = new Map<string, string>();
  private laneNameByElement = new Map<string, string>();
  private relayoutQueued = false;
  private relayoutRunning = false;
  private participantSeq = 1;

  readonly politica = signal<Politica | null>(null);
  readonly departamentos = signal<Departamento[]>([]);
  readonly isSaving = signal(false);
  readonly validationErrors = signal<string[]>([]);
  readonly showValidationModal = signal(false);
  private politicaId: string | null = null;

  ngOnInit(): void {
    this.departamentoService.list(0, 100).subscribe({
      next: (page) => this.departamentos.set(page.items ?? []),
      error: () => this.departamentos.set([]),
    });
  }

  async ngAfterViewInit(): Promise<void> {
    this.politicaId = this.route.snapshot.paramMap.get('politicaId');
    if (!this.politicaId) {
      this.router.navigate(['/gestor/politicas']);
      return;
    }

    this.initModeler();

    this.politicaService.getById(this.politicaId).subscribe({
      next: async (p) => {
        this.politica.set(p);
        await this.importSafeXml(this.toBpmnXml(p.diagramaJson));
      },
      error: (err) => window.alert(err?.error?.message ?? 'No se pudo cargar la política'),
    });
  }

  ngOnDestroy(): void {
    try {
      this.modeler?.destroy();
    } finally {
      this.modeler = null;
    }
  }

  private initModeler(): void {
    this.modeler = new BpmnModeler({
      container: '#bpmn-canvas',
      keyboard: {
        bindTo: document,
      },
      additionalModules: [
        {
          paletteProvider: ['value', null],
        },
      ],
    });

    const eventBus = this.get('eventBus');
    eventBus?.on?.('element.dblclick', (event: any) => {
      const element = event?.element;
      if (!element || element.type === 'label' || element.type === 'bpmn:Process') return;
      const directEditing = this.get('directEditing');
      // edición inline dentro del nodo
      directEditing?.activate?.(element);
    });

    eventBus?.on?.('shape.added', (event: any) => {
      const element = event?.element;
      if (element?.type === 'bpmn:Participant') {
        this.normalizeParticipant(element);
        this.addLaneOverlays(element);
        this.scheduleRelayoutParticipants();
      }
    });

    eventBus?.on?.('shape.removed', (event: any) => {
      const element = event?.element;
      const overlayId = this.laneOverlayByElement.get(element?.id);
      if (overlayId) {
        this.get('overlays')?.remove?.(overlayId);
        this.laneOverlayByElement.delete(element.id);
      }
      const titleOverlayId = this.laneTitleOverlayByElement.get(element?.id);
      if (titleOverlayId) {
        this.get('overlays')?.remove?.(titleOverlayId);
        this.laneTitleOverlayByElement.delete(element.id);
      }
      this.laneNameByElement.delete(element?.id);
      this.scheduleRelayoutParticipants();
    });

    eventBus?.on?.('shape.move.end', (event: any) => {
      const element = event?.context?.shape;
      if (element?.type === 'bpmn:Participant') {
        this.addLaneOverlays(element);
      }
    });
  }

  private async importSafeXml(xml: string): Promise<void> {
    if (!this.modeler) return;
    try {
      await this.modeler.importXML(xml);
    } catch {
      await this.modeler.importXML(this.blankDiagram());
    }
    this.resetZoom();
    this.scheduleRelayoutParticipants();
  }

  async guardarDiagrama(): Promise<void> {
    const politica = this.politica();
    if (!politica || !this.modeler) return;
    if (!this.validarDiagrama()) return;

    this.isSaving.set(true);
    try {
      const { xml } = await this.modeler.saveXML({ format: true });
      const payload = {
        nombre: politica.nombre,
        descripcion: politica.descripcion,
        diagramaJson: xml ?? null,
      };
      this.politicaService.update(politica.id, payload).subscribe({
        next: (updated) => {
          this.politica.set(updated);
          this.isSaving.set(false);
          window.alert('Diagrama guardado');
        },
        error: (err) => {
          this.isSaving.set(false);
          window.alert(err?.error?.message ?? 'No se pudo guardar el diagrama');
        },
      });
    } catch {
      this.isSaving.set(false);
      window.alert('No se pudo exportar el diagrama');
    }
  }

  async guardar(): Promise<void> {
    await this.guardarDiagrama();
  }

  autoLayout(): void {
    this.autoOrganizarNodos();
    this.resetZoom();
  }

  zoomIn(): void {
    const canvas = this.get('canvas');
    if (!canvas) return;
    try {
      const current = Number(canvas.zoom?.() ?? 1);
      if (!Number.isFinite(current)) return;
      canvas.zoom(current + 0.1);
    } catch {
      // evita "non-finite" SVGMatrix errors
    }
  }

  zoomOut(): void {
    const canvas = this.get('canvas');
    if (!canvas) return;
    try {
      const current = Number(canvas.zoom?.() ?? 1);
      if (!Number.isFinite(current)) return;
      canvas.zoom(Math.max(0.2, current - 0.1));
    } catch {
      // evita "non-finite" SVGMatrix errors
    }
  }

  resetZoom(): void {
    const canvas = this.get('canvas');
    if (!canvas) return;
    try {
      this.syncCanvasViewport();
    } catch {
      // ignore si no hay viewport válido todavía
    }
  }

  onNodoDragStart(event: DragEvent, type: string, loop = false): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        kind: 'node',
        bpmnType: type,
        loop,
      })
    );
    event.dataTransfer.effectAllowed = 'copy';
  }

  onCarrilDragStart(event: DragEvent, depto: Departamento): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        kind: 'participant',
        name: depto.nombre,
      })
    );
    event.dataTransfer.effectAllowed = 'copy';
  }

  onCanvasDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    const raw = event.dataTransfer?.getData('text/plain') ?? '{}';
    let data: { kind?: string; name?: string; bpmnType?: string; loop?: boolean };
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    if (data.kind === 'participant' && data.name) {
      this.crearParticipant(data.name);
      return;
    }
    if (data.kind === 'node' && data.bpmnType) {
      this.crearNodo(data.bpmnType, event, Boolean(data.loop));
    }
  }

  private crearParticipant(name: string): void {
    const modeling = this.get('modeling');
    const elementFactory = this.get('elementFactory');
    const canvas = this.get('canvas');
    const moddle = this.get('moddle');
    if (!modeling || !elementFactory || !canvas || !moddle) return;
    const alreadyExists = Array.from(this.laneNameByElement.values()).some(
      (n) => n.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (alreadyExists) {
      window.alert(`El carril '${name}' ya existe.`);
      return;
    }
    this.syncCanvasViewport();
    const root = canvas.getRootElement();
    const viewbox = canvas.viewbox?.();
    const topMargin = 24;
    const bottomMargin = 16;
    const laneHeight = Math.max(300, (viewbox?.height ?? 700) - topMargin - bottomMargin);
    const laneWidth = 220;
    const x = (viewbox?.x ?? 0) + 8;
    const y = (viewbox?.y ?? 0) + topMargin + laneHeight / 2;
    const participantBo = moddle.create('bpmn:Participant', { name });
    participantBo.processRef = moddle.create('bpmn:Process', {
      id: `Process_Participant_${this.participantSeq++}`,
      isExecutable: false,
      flowElements: [],
    });
    const participant = elementFactory.createShape({
      type: 'bpmn:Participant',
      width: laneWidth,
      height: laneHeight,
      businessObject: participantBo,
    });
    const created = modeling.createShape(participant, { x, y }, root);
    this.laneNameByElement.set(created.id, name);
    this.normalizeParticipant(created);
    this.addLaneOverlays(created);
    this.scheduleRelayoutParticipants();
  }

  private crearNodo(type: string, event: DragEvent, loop = false): void {
    const modeling = this.get('modeling');
    const elementFactory = this.get('elementFactory');
    const canvas = this.get('canvas');
    const moddle = this.get('moddle');
    if (!modeling || !elementFactory || !canvas || !moddle) return;
    if (this.getParticipants().length === 0) {
      window.alert('Primero crea un carril vertical y luego agrega nodos.');
      return;
    }
    const point = this.toDiagramPoint(event);
    // Root para permitir conexiones entre carriles sin restricciones.
    const parent = canvas.getRootElement();
    const shape = elementFactory.createShape({ type });
    const created = modeling.createShape(shape, point, parent);
    if (created?.businessObject && type === 'bpmn:Task') {
      const updates: any = { name: loop ? 'Iterativo' : 'Tarea' };
      if (loop) {
        updates.loopCharacteristics = moddle.create('bpmn:StandardLoopCharacteristics');
      }
      modeling.updateProperties(created, updates);
    }
    if (created?.businessObject && type === 'bpmn:ExclusiveGateway') {
      modeling.updateProperties(created, { name: 'Decisión' });
    }
  }

  private toDiagramPoint(event: DragEvent): { x: number; y: number } {
    const canvas = this.get('canvas');
    const container: HTMLElement | null = canvas?.getContainer?.() ?? null;
    const rect = container?.getBoundingClientRect();
    const viewbox = canvas?.viewbox?.();
    const zoom = Number(canvas?.zoom?.() ?? 1);
    if (!rect || !viewbox || !Number.isFinite(zoom) || zoom <= 0) {
      return { x: 300, y: 200 };
    }
    return {
      x: viewbox.x + (event.clientX - rect.left) / zoom,
      y: viewbox.y + (event.clientY - rect.top) / zoom,
    };
  }

  private findDropParent(x: number, y: number): any {
    const participants = this.getParticipants();
    return participants.find(
      (p: any) => x >= p.x && x <= p.x + p.width && y >= p.y && y <= p.y + p.height
    );
  }

  private getParticipants(): any[] {
    const registry = this.get('elementRegistry');
    return (registry?.getAll?.() ?? []).filter((el: any) => el.type === 'bpmn:Participant');
  }

  private nextParticipantX(): number {
    const participants = this.getParticipants();
    if (!participants.length) return 180;
    return Math.max(...participants.map((p: any) => (p.x ?? 0) + (p.width ?? 220))) + 40;
  }

  private suggestedLaneX(): number {
    const registry = this.get('elementRegistry');
    const all = registry?.getAll?.() ?? [];
    const nonParticipants = all.filter(
      (el: any) =>
        el?.type?.startsWith?.('bpmn:') &&
        el.type !== 'bpmn:Participant' &&
        el.type !== 'bpmn:Process' &&
        !el.type.endsWith('Label')
    );
    if (!nonParticipants.length) return 180;
    return Math.max(...nonParticipants.map((n: any) => (n.x ?? 0) + (n.width ?? 120))) + 60;
  }

  private normalizeParticipant(element: any): void {
    this.ensureParticipantSemantic(element);
    const currentName = element?.businessObject?.name;
    if (currentName && !this.laneNameByElement.has(element.id)) {
      this.laneNameByElement.set(element.id, currentName);
    }
    if (element?.businessObject) {
      // Evita que bpmn-js dibuje etiquetas laterales/centrales del participant.
      element.businessObject.name = '';
    }
    if (element?.di) {
      // Con horizontal=true evitamos que el carril se "achique" en columna izquierda.
      element.di.isHorizontal = true;
      this.get('eventBus')?.fire?.('elements.changed', { elements: [element] });
    }
  }

  private ensureParticipantSemantic(element: any): void {
    const moddle = this.get('moddle');
    const bo = element?.businessObject;
    if (!moddle || !bo) return;
    if (!bo.processRef) {
      bo.processRef = moddle.create('bpmn:Process', {
        id: `Process_Participant_${this.participantSeq++}`,
        isExecutable: false,
        flowElements: [],
      });
    }
    if (!Array.isArray(bo.processRef.flowElements)) {
      bo.processRef.flowElements = [];
    }
  }

  private addLaneOverlays(element: any): void {
    const overlays = this.get('overlays');
    if (!overlays || !element?.id) return;
    const previousDelete = this.laneOverlayByElement.get(element.id);
    if (previousDelete) overlays.remove(previousDelete);
    const previousTitle = this.laneTitleOverlayByElement.get(element.id);
    if (previousTitle) overlays.remove(previousTitle);

    const laneName = this.laneNameByElement.get(element.id) ?? element.businessObject?.name ?? 'Carril';
    const title = document.createElement('div');
    title.className = 'lane-title';
    title.textContent = laneName;
    const titleWidth = 120;
    const titleLeft = Math.max(8, ((element.width ?? 220) - titleWidth) / 2);
    const titleId = overlays.add(element, 'note', {
      position: { top: 8, left: titleLeft },
      html: title,
    });
    this.laneTitleOverlayByElement.set(element.id, titleId);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lane-delete-btn';
    btn.textContent = 'x';
    btn.title = 'Eliminar carril';
    btn.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.get('modeling')?.removeElements?.([element]);
    };
    const deleteId = overlays.add(element, 'note', {
      position: { top: -8, right: -8 },
      html: btn,
    });
    this.laneOverlayByElement.set(element.id, deleteId);
  }

  private relayoutParticipants(): void {
    const participants = this.getParticipants().sort((a: any, b: any) => (a.x ?? 0) - (b.x ?? 0));
    const canvas = this.get('canvas');
    const eventBus = this.get('eventBus');
    if (!participants.length || !canvas) return;
    this.syncCanvasViewport();
    const viewbox = canvas.viewbox?.();
    if (!viewbox) return;

    const laneWidth = viewbox.width / participants.length;
    const laneHeight = viewbox.height;
    participants.forEach((participant: any, index: number) => {
      const x = viewbox.x + laneWidth * index;
      const y = viewbox.y;
      participant.x = x;
      participant.y = y;
      participant.width = laneWidth;
      participant.height = laneHeight;
      const bounds = participant.di?.bounds;
      if (bounds) {
        bounds.x = x;
        bounds.y = y;
        bounds.width = laneWidth;
        bounds.height = laneHeight;
      }
      this.normalizeParticipant(participant);
      this.addLaneOverlays(participant);
    });
    eventBus?.fire?.('elements.changed', { elements: participants });
  }

  private autoOrganizarNodos(): void {
    const modeling = this.get('modeling');
    const registry = this.get('elementRegistry');
    if (!modeling || !registry) return;
    const participants = this.getParticipants().sort((a: any, b: any) => (a.x ?? 0) - (b.x ?? 0));
    if (!participants.length) return;

    const allNodes = (registry.getAll?.() ?? [])
      .filter((el: any) => el?.type?.startsWith?.('bpmn:'))
      .filter((el: any) => !el.type.endsWith('Label') && el.type !== 'bpmn:SequenceFlow' && el.type !== 'bpmn:Participant');

    participants.forEach((participant: any) => {
      const nodes = allNodes
        .filter((el: any) => {
          const cx = (el.x ?? 0) + (el.width ?? 0) / 2;
          return cx >= participant.x && cx <= participant.x + participant.width;
        })
        .filter((el: any) => el?.type?.startsWith?.('bpmn:'))
        .filter((el: any) => !el.type.endsWith('Label'));
      if (!nodes.length) return;

      const topPad = 70;
      const step = 95;
      const centerX = participant.x + participant.width / 2;
      nodes
        .sort((a: any, b: any) => (a.y ?? 0) - (b.y ?? 0))
        .forEach((node: any, idx: number) => {
          const targetX = centerX - (node.width ?? 36) / 2;
          const targetY = participant.y + topPad + idx * step;
          modeling.moveShape(node, { x: targetX - node.x, y: targetY - node.y });
        });
    });
  }

  private scheduleRelayoutParticipants(): void {
    if (this.relayoutQueued) return;
    this.relayoutQueued = true;
    setTimeout(() => {
      this.relayoutQueued = false;
      this.relayoutParticipants();
    }, 0);
  }

  private syncCanvasViewport(): void {
    const canvas = this.get('canvas');
    const container = canvas?.getContainer?.() as HTMLElement | undefined;
    if (!canvas) return;
    canvas.zoom(1);
    canvas.viewbox({
      x: 0,
      y: 0,
      width: Math.max(900, container?.clientWidth ?? 900),
      height: Math.max(520, container?.clientHeight ?? 520),
    });
  }

  async exportarPNG(): Promise<void> {
    if (!this.modeler) return;
    const { svg } = await this.modeler.saveSVG();
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `diagrama-${this.politica()?.id ?? 'politica'}.png`;
      a.click();
    };
    img.src = url;
  }

  async exportarPDF(): Promise<void> {
    if (!this.modeler) return;
    const { svg } = await this.modeler.saveSVG();
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const png = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      pdf.addImage(png, 'PNG', 0, 0, w, h);
      pdf.save(`diagrama-${this.politica()?.id ?? 'politica'}.pdf`);
    };
    img.src = url;
  }

  validarDiagrama(): boolean {
    const errors = this.collectValidationErrors();
    if (errors.length) {
      this.validationErrors.set(errors);
      this.showValidationModal.set(true);
      return false;
    }
    this.validationErrors.set([]);
    this.showValidationModal.set(false);
    window.alert('Diagrama válido');
    return true;
  }

  validar(): boolean {
    return this.validarDiagrama();
  }

  private collectValidationErrors(): string[] {
    const registry = this.get('elementRegistry');
    const nodes = (registry?.getAll?.() ?? [])
      .filter((e: any) => e.type && e.type.startsWith('bpmn:') && !e.type.endsWith('Label'))
      .filter((e: any) => e.type !== 'bpmn:SequenceFlow' && e.type !== 'bpmn:Participant');
    const starts = nodes.filter((e: any) => e.type === 'bpmn:StartEvent');
    const ends = nodes.filter((e: any) => e.type === 'bpmn:EndEvent');
    const tasks = nodes.filter((e: any) => e.type === 'bpmn:Task');
    const errors: string[] = [];

    if (starts.length < 1) errors.push('El diagrama debe tener un nodo Inicio');
    if (ends.length < 1) errors.push('Debe existir al menos un Fin');
    if (tasks.length < 1) errors.push('El diagrama debe tener al menos una Tarea');

    nodes.forEach((n: any) => {
      const incoming = (n.businessObject?.incoming ?? []).length;
      const outgoing = (n.businessObject?.outgoing ?? []).length;
      if (incoming === 0 && outgoing === 0) {
        errors.push(`El nodo '${n.businessObject?.name || n.type}' está desconectado`);
      }
    });

    if (starts.length && ends.length) {
      const visited = new Set<string>();
      const queue: any[] = [starts[0]];
      while (queue.length) {
        const current = queue.shift();
        if (!current || visited.has(current.id)) continue;
        visited.add(current.id);
        (current.businessObject?.outgoing ?? []).forEach((flow: any) => {
          const target = registry?.get?.(flow?.targetRef?.id);
          if (target && !visited.has(target.id)) queue.push(target);
        });
      }
      const reachesEnd = ends.some((end: any) => visited.has(end.id));
      if (!reachesEnd) errors.push('No existe un camino válido desde Inicio hasta Fin');
    }

    return errors;
  }

  closeValidationModal(): void {
    this.showValidationModal.set(false);
  }

  private toBpmnXml(value: string | null): string {
    if (!value) return this.blankDiagram();
    const v = value.trim();
    if (v.startsWith('<?xml') || v.includes('<bpmn:definitions')) return v;
    return this.blankDiagram();
  }

  private blankDiagram(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="BPMNShape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="170" y="120" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  }

  private get(name: string): any {
    return (this.modeler as any)?.get?.(name);
  }
}

