import { Injectable, signal } from '@angular/core';
import BpmnModeler from 'bpmn-js/lib/Modeler';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type BpmnElementType =
  | 'bpmn:StartEvent'
  | 'bpmn:EndEvent'
  | 'bpmn:Task'
  | 'bpmn:ExclusiveGateway'
  | 'bpmn:ParallelGateway'
  | 'bpmn:InclusiveGateway'
  | 'other';

export type TaskPriority = 'ALTA' | 'MEDIA' | 'BAJA';

export interface TaskProps {
  nombre: string;
  descripcion: string;
  departamentoId: string | null;
  formularioId: string | null;
  tiempoEstimadoHoras: number | null;
  prioridad: TaskPriority;
  instrucciones: string;
}

export interface GatewayCondition {
  id: string;
  label: string;
  expression: string;
}

export interface GatewayProps {
  nombre: string;
  condiciones: GatewayCondition[];
  expresionGlobal: string;
}

export interface SelectedElementVM {
  id: string;
  type: BpmnElementType;
  name: string;
  raw: unknown;
}

export interface ValidationIssue {
  level: 'ERROR' | 'WARN';
  code:
    | 'START_COUNT'
    | 'END_COUNT'
    | 'DISCONNECTED'
    | 'TASK_DEPT'
    | 'GATEWAY_CONDITIONS'
    | 'PARALLEL_BALANCE'
    | 'INFINITE_CYCLE';
  message: string;
  elementIds?: string[];
}

// bpmn-js expone servicios internos sin typings estrictos en este proyecto
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = any;

const META_DOC_MARK = 'FLOWPOLICY_META:';

@Injectable({ providedIn: 'root' })
export class DiagramaBpmnService {
  private modeler?: BpmnModeler;

  readonly selected = signal<SelectedElementVM | null>(null);
  readonly isReady = signal(false);

  init(options: { canvas: HTMLElement; propertiesPanel: HTMLElement }): void {
    this.destroy();

    this.modeler = new BpmnModeler({
      container: options.canvas,
      propertiesPanel: {
        parent: options.propertiesPanel,
      },
      additionalModules: [BpmnPropertiesPanelModule, BpmnPropertiesProviderModule],
    });

    this.isReady.set(true);

    const eventBus: any = this.get('eventBus');
    eventBus?.['on']?.('selection.changed', (e: AnyObj) => {
      const newSel = (e?.['newSelection'] as unknown[]) ?? [];
      const el = newSel?.[0] as AnyObj | undefined;
      this.selected.set(el ? this.toSelectedVm(el) : null);
    });
  }

  destroy(): void {
    this.selected.set(null);
    this.isReady.set(false);
    this.modeler?.destroy();
    this.modeler = undefined;
  }

  async importXml(xml: string): Promise<void> {
    if (!this.modeler) throw new Error('Modeler no inicializado');
    await this.modeler.importXML(xml);
    this.fitViewport();
  }

  async exportXml(pretty = true): Promise<string> {
    if (!this.modeler) throw new Error('Modeler no inicializado');
    const { xml } = await this.modeler.saveXML({ format: pretty });
    return xml ?? '';
  }

  fitViewport(): void {
    const canvas: any = this.get('canvas');
    try {
      canvas?.['zoom']?.('fit-viewport');
    } catch {
      // ignore
    }
  }

  zoomIn(): void {
    const canvas: any = this.get('canvas');
    try {
      const z = canvas?.['zoom']?.();
      canvas?.['zoom']?.((typeof z === 'number' ? z : 1) + 0.1);
    } catch {
      // ignore
    }
  }

  zoomOut(): void {
    const canvas: any = this.get('canvas');
    try {
      const z = canvas?.['zoom']?.();
      canvas?.['zoom']?.((typeof z === 'number' ? z : 1) - 0.1);
    } catch {
      // ignore
    }
  }

  removeElement(elementId: string): void {
    const el = this.getElement(elementId);
    const modeling: any = this.get('modeling');
    try {
      modeling?.['removeElements']?.([el]);
    } catch {
      // ignore
    }
  }

  /** Exporta el canvas del modeler como PNG (dataURL). */
  async exportPngDataUrl(canvasHost: HTMLElement): Promise<string> {
    const el = canvasHost;
    const c = await html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });
    return c.toDataURL('image/png');
  }

  async exportPdf(canvasHost: HTMLElement, filename = 'diagrama.pdf'): Promise<void> {
    const png = await this.exportPngDataUrl(canvasHost);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.addImage(png, 'PNG', 0, 0, pageW, pageH);
    pdf.save(filename);
  }

  validate(): ValidationIssue[] {
    if (!this.modeler) return [{ level: 'ERROR', code: 'DISCONNECTED', message: 'Editor no inicializado' }];

    const elementRegistry: any = this.get('elementRegistry');
    const elements = (elementRegistry?.['getAll']?.() as AnyObj[]) ?? [];
    const flowNodes = elements.filter((e) => {
      const bo = this.bo(e);
      const t = (bo?.['$type'] as string) ?? '';
      return t.startsWith('bpmn:') && !t.endsWith('SequenceFlow') && !t.endsWith('Label');
    });

    const issues: ValidationIssue[] = [];

    const starts = flowNodes.filter((e) => this.bo(e)?.['$type'] === 'bpmn:StartEvent');
    const ends = flowNodes.filter((e) => this.bo(e)?.['$type'] === 'bpmn:EndEvent');

    if (starts.length !== 1) {
      issues.push({
        level: 'ERROR',
        code: 'START_COUNT',
        message: `Debe haber EXACTAMENTE 1 INICIO (actual: ${starts.length}).`,
        elementIds: starts.map((s) => String(s['id'])),
      });
    }
    if (ends.length < 1) {
      issues.push({ level: 'ERROR', code: 'END_COUNT', message: 'Debe haber al menos 1 FIN.' });
    }

    // Conectividad: todo nodo (excepto start) debe tener incoming; todo nodo (excepto end) debe tener outgoing
    const disconnected = flowNodes.filter((e) => {
      const bo = this.bo(e);
      const t = bo?.['$type'] as string;
      const incoming = (bo?.['incoming'] as AnyObj[] | undefined) ?? [];
      const outgoing = (bo?.['outgoing'] as AnyObj[] | undefined) ?? [];
      if (t === 'bpmn:StartEvent') return outgoing.length === 0;
      if (t === 'bpmn:EndEvent') return incoming.length === 0;
      return incoming.length === 0 || outgoing.length === 0;
    });
    if (disconnected.length) {
      issues.push({
        level: 'ERROR',
        code: 'DISCONNECTED',
        message: 'Hay nodos sueltos o sin conexiones (revisa entradas/salidas).',
        elementIds: disconnected.map((d) => String(d['id'])),
      });
    }

    // Tareas con departamento
    const tasks = flowNodes.filter((e) => this.bo(e)?.['$type'] === 'bpmn:Task');
    const tasksSinDept = tasks.filter((t) => {
      const meta = this.readMeta(this.bo(t));
      return !meta?.['task']?.departamentoId;
    });
    if (tasksSinDept.length) {
      issues.push({
        level: 'ERROR',
        code: 'TASK_DEPT',
        message: 'Todas las TAREAS deben tener departamento asignado.',
        elementIds: tasksSinDept.map((t) => String(t['id'])),
      });
    }

    // Gateways con condiciones (exclusive / inclusive): cada salida debe tener label/expr
    const gateways = flowNodes.filter((e) => {
      const t = this.bo(e)?.['$type'];
      return t === 'bpmn:ExclusiveGateway' || t === 'bpmn:InclusiveGateway';
    });
    const gatewaysBad = gateways.filter((g) => {
      const meta = this.readMeta(this.bo(g));
      return !meta?.['gateway']?.condiciones?.length;
    });
    if (gatewaysBad.length) {
      issues.push({
        level: 'ERROR',
        code: 'GATEWAY_CONDITIONS',
        message: 'Las DECISIONES (gateways) deben tener condiciones definidas.',
        elementIds: gatewaysBad.map((g) => String(g['id'])),
      });
    }

    // Paralelos balanceados (heurística): gateway paralelo debe tener in>=1 out>=2 (fork) o in>=2 out>=1 (join)
    const parallels = flowNodes.filter((e) => this.bo(e)?.['$type'] === 'bpmn:ParallelGateway');
    const parallelBad = parallels.filter((g) => {
      const bo = this.bo(g);
      const incoming = ((bo?.['incoming'] as AnyObj[] | undefined) ?? []).length;
      const outgoing = ((bo?.['outgoing'] as AnyObj[] | undefined) ?? []).length;
      const isFork = incoming === 1 && outgoing >= 2;
      const isJoin = incoming >= 2 && outgoing === 1;
      return !(isFork || isJoin);
    });
    if (parallelBad.length) {
      issues.push({
        level: 'WARN',
        code: 'PARALLEL_BALANCE',
        message: 'Hay gateways paralelos que no parecen fork/join (verifica balance de ramas).',
        elementIds: parallelBad.map((g) => String(g['id'])),
      });
    }

    return issues;
  }

  // ===== Metadata FlowPolicy (guardado en documentation) =====

  getTaskProps(elementId: string): TaskProps {
    const el = this.getElement(elementId);
    const bo = this.bo(el);
    const meta = this.readMeta(bo);
    const name = String(bo?.['name'] ?? '');
    return {
      nombre: name,
      descripcion: meta?.['task']?.descripcion ?? '',
      departamentoId: meta?.['task']?.departamentoId ?? null,
      formularioId: meta?.['task']?.formularioId ?? null,
      tiempoEstimadoHoras: meta?.['task']?.tiempoEstimadoHoras ?? null,
      prioridad: meta?.['task']?.prioridad ?? 'MEDIA',
      instrucciones: meta?.['task']?.instrucciones ?? '',
    };
  }

  setTaskProps(elementId: string, props: TaskProps): void {
    const el = this.getElement(elementId);
    const modeling: any = this.get('modeling');
    modeling?.['updateProperties']?.(el, { name: props.nombre });

    const bo = this.bo(el);
    const meta = this.readMeta(bo) ?? {};
    meta['task'] = {
      descripcion: props.descripcion,
      departamentoId: props.departamentoId,
      formularioId: props.formularioId,
      tiempoEstimadoHoras: props.tiempoEstimadoHoras,
      prioridad: props.prioridad,
      instrucciones: props.instrucciones,
    };
    this.writeMeta(bo, meta);
  }

  getGatewayProps(elementId: string): GatewayProps {
    const el = this.getElement(elementId);
    const bo = this.bo(el);
    const meta = this.readMeta(bo);
    return {
      nombre: String(bo?.['name'] ?? ''),
      condiciones: meta?.['gateway']?.condiciones ?? [],
      expresionGlobal: meta?.['gateway']?.expresionGlobal ?? '',
    };
  }

  setGatewayProps(elementId: string, props: GatewayProps): void {
    const el = this.getElement(elementId);
    const modeling: any = this.get('modeling');
    modeling?.['updateProperties']?.(el, { name: props.nombre });

    const bo = this.bo(el);
    const meta = this.readMeta(bo) ?? {};
    meta['gateway'] = {
      condiciones: props.condiciones,
      expresionGlobal: props.expresionGlobal,
    };
    this.writeMeta(bo, meta);
  }

  // ===== helpers =====

  defaultXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="INICIO" />
    <bpmn:endEvent id="EndEvent_1" name="FIN" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="140" y="120" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_EndEvent_1" bpmnElement="EndEvent_1">
        <dc:Bounds x="440" y="120" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  }

  toBpmnXml(value: string | null): string {
    if (!value) return this.defaultXml();
    const v = value.trim();
    if (v.startsWith('<?xml') || v.includes('<bpmn:definitions')) return v;
    return this.defaultXml();
  }

  private get<T = AnyObj>(name: string): T | undefined {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.modeler as any)?.get?.(name) as T | undefined;
  }

  private getElement(elementId: string): AnyObj {
    const elementRegistry: any = this.get('elementRegistry');
    const el = elementRegistry?.['get']?.(elementId) as AnyObj | undefined;
    if (!el) throw new Error('Elemento no encontrado');
    return el;
  }

  private bo(element: AnyObj | undefined): AnyObj | undefined {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (element as any)?.businessObject as AnyObj | undefined;
  }

  private toSelectedVm(el: AnyObj): SelectedElementVM {
    const bo = this.bo(el);
    const $type = String(bo?.['$type'] ?? 'other');
    const type = ([
      'bpmn:StartEvent',
      'bpmn:EndEvent',
      'bpmn:Task',
      'bpmn:ExclusiveGateway',
      'bpmn:ParallelGateway',
      'bpmn:InclusiveGateway',
    ] as string[]).includes($type)
      ? ($type as BpmnElementType)
      : 'other';
    return {
      id: String(el['id']),
      type,
      name: String(bo?.['name'] ?? ''),
      raw: el,
    };
  }

  private readMeta(bo: AnyObj | undefined): AnyObj | null {
    if (!bo) return null;
    const docs = (bo['documentation'] as AnyObj[] | undefined) ?? [];
    const text = docs
      .map((d) => String(d['text'] ?? ''))
      .find((t) => t.startsWith(META_DOC_MARK));
    if (!text) return null;
    const json = text.slice(META_DOC_MARK.length);
    try {
      return JSON.parse(json) as AnyObj;
    } catch {
      return null;
    }
  }

  private writeMeta(bo: AnyObj | undefined, meta: AnyObj): void {
    if (!bo) return;
    const bpmnFactory: any = this.get('bpmnFactory');
    const modeling: any = this.get('modeling');

    const docs = (bo['documentation'] as AnyObj[] | undefined) ?? [];
    const nextText = `${META_DOC_MARK}${JSON.stringify(meta)}`;

    const existingIdx = docs.findIndex((d) => String(d['text'] ?? '').startsWith(META_DOC_MARK));
    const nextDocs = [...docs];
    if (existingIdx >= 0) {
      nextDocs[existingIdx] = { ...nextDocs[existingIdx], text: nextText };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = bpmnFactory?.['create']?.('bpmn:Documentation', { text: nextText }) ?? { text: nextText };
      nextDocs.push(doc);
    }

    modeling?.['updateProperties']?.(bo, { documentation: nextDocs });
  }
}

