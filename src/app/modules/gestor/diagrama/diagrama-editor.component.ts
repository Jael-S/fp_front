import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import jsPDF from 'jspdf';
import { Departamento } from '../../../core/models/departamento.model';
import { Formulario } from '../../../core/models/formulario.model';
import { DepartamentoService } from '../../../core/services/departamento.service';
import { FormularioService } from '../../../core/services/formulario.service';
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
export class DiagramaEditorComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly politicaService = inject(PoliticaService);
  private readonly departamentoService = inject(DepartamentoService);
  private readonly formularioService = inject(FormularioService);

  private modeler: BpmnModeler | null = null;
  private politica: Politica | null = null;
  private departamentos: Departamento[] = [];
  private formularios: Formulario[] = [];
  isSaving = false;
  private politicaId: string | null = null;

  async ngAfterViewInit(): Promise<void> {
    this.politicaId = this.route.snapshot.paramMap.get('politicaId');
    if (!this.politicaId) {
      this.router.navigate(['/gestor/politicas']);
      return;
    }

    this.initModeler();
    this.registerElementClickHandler();
    this.departamentoService.list(0, 200).subscribe({
      next: (res) => (this.departamentos = res.items),
      error: () => (this.departamentos = []),
    });
    this.formularioService.listByPolitica(this.politicaId).subscribe({
      next: (res) => (this.formularios = res),
      error: () => (this.formularios = []),
    });

    this.politicaService.getById(this.politicaId).subscribe({
      next: async (p) => {
        this.politica = p;
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
    });
  }

  private registerElementClickHandler(): void {
    const eventBus = this.get('eventBus');
    eventBus?.on?.('element.click', (event: any) => {
      const element = event?.element;
      if (!element?.type) return;
      if (element.type === 'bpmn:Task') {
        this.abrirModalSeleccionarFormulario(element);
      }
      if (element.type === 'bpmn:ExclusiveGateway') {
        this.abrirModalEditarDecision(element);
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
    this.autoLayout();
  }

  async guardar(): Promise<void> {
    const politica = this.politica;
    if (!politica || !this.modeler) return;
    if (!this.validar()) return;

    this.isSaving = true;
    try {
      const { xml } = await this.modeler.saveXML({ format: true });
      if (!xml) {
        this.isSaving = false;
        window.alert('No se pudo exportar el XML');
        return;
      }
      if (!this.validarCarrilesConDepartamentos(xml)) {
        this.isSaving = false;
        return;
      }
      this.politicaService.guardarDiagramaCompleto(politica.id, xml).subscribe({
        next: (updated) => {
          this.politica = {
            ...politica,
            diagramaJson: xml,
          };
          this.isSaving = false;
          window.alert('Diagrama guardado');
        },
        error: (err) => {
          this.isSaving = false;
          window.alert(err?.error?.message ?? 'No se pudo guardar el diagrama');
        },
      });
    } catch {
      this.isSaving = false;
      window.alert('No se pudo exportar el diagrama');
    }
  }

  private validarCarrilesConDepartamentos(xml: string): boolean {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const participants = Array.from(doc.querySelectorAll('bpmn\\:participant, participant'));
    for (const participant of participants) {
      const nombreCarril = participant.getAttribute('name')?.trim() ?? '';
      if (!nombreCarril) continue;
      const match = this.departamentos.find((d) => d.nombre.trim().toLowerCase() === nombreCarril.toLowerCase());
      if (!match) {
        window.alert(`El departamento "${nombreCarril}" no existe. Cree el departamento primero.`);
        return false;
      }
    }
    return true;
  }

  autoLayout(): void {
    const canvas = this.get('canvas');
    if (!canvas) return;
    canvas.zoom('fit-viewport');
  }

  zoomIn(): void {
    const canvas = this.get('canvas');
    if (!canvas) return;
    const current = Number(canvas.zoom?.() ?? 1);
    if (!Number.isFinite(current)) return;
    canvas.zoom(current * 1.1);
  }

  zoomOut(): void {
    const canvas = this.get('canvas');
    if (!canvas) return;
    const current = Number(canvas.zoom?.() ?? 1);
    if (!Number.isFinite(current)) return;
    canvas.zoom(Math.max(0.2, current * 0.9));
  }

  resetZoom(): void {
    const canvas = this.get('canvas');
    if (!canvas) return;
    canvas.zoom(1);
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
      a.download = `diagrama-${this.politica?.id ?? 'politica'}.png`;
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
      pdf.save(`diagrama-${this.politica?.id ?? 'politica'}.pdf`);
    };
    img.src = url;
  }

  private abrirModalSeleccionarFormulario(taskElement: any): void {
    if (!this.politicaId) return;
    const taskId = String(taskElement?.id ?? '');
    const taskNombre = String(taskElement?.businessObject?.name ?? 'Tarea sin nombre');
    if (!this.formularios.length) {
      window.alert('No hay formularios disponibles. Cree uno primero desde Formularios.');
      return;
    }
    const opciones = this.formularios
      .map((f, idx) => `${idx + 1}. ${f.nombre} (${f.id})`)
      .join('\n');
    const input = window.prompt(`Asignar formulario a "${taskNombre}"\n\n${opciones}\n\nIngrese numero de opcion:`);
    if (!input) return;
    const index = Number(input) - 1;
    if (Number.isNaN(index) || index < 0 || index >= this.formularios.length) {
      window.alert('Opcion invalida');
      return;
    }
    const formulario = this.formularios[index];
    this.politicaService.asignarFormularioATarea(this.politicaId, taskId, formulario.id).subscribe({
      next: () => window.alert(`Formulario "${formulario.nombre}" asignado a "${taskNombre}"`),
      error: (err) => window.alert(err?.error?.message ?? 'No se pudo asignar el formulario'),
    });
  }

  private abrirModalEditarDecision(gatewayElement: any): void {
    if (!this.politicaId) return;
    const gatewayId = String(gatewayElement?.id ?? '');
    const currentName = String(gatewayElement?.businessObject?.name ?? '');
    const nuevoNombre = window.prompt('Etiqueta de la decision:', currentName) ?? currentName;
    const outgoing: any[] = gatewayElement?.businessObject?.outgoing ?? [];
    const condiciones: Array<{ salida: string; destinoId: string }> = [];
    for (const flow of outgoing) {
      const destinoId = String(flow?.targetRef?.id ?? '');
      const actual = String(flow?.name ?? '');
      const salida = window.prompt(`Condicion para salida hacia ${destinoId}:`, actual) ?? actual;
      condiciones.push({ salida, destinoId });
    }

    this.politicaService
      .guardarCondicionesDecision(this.politicaId, gatewayId, { texto: nuevoNombre, condiciones })
      .subscribe({
        next: () => {
          const modeling = this.get('modeling');
          const elementRegistry = this.get('elementRegistry');
          const gateway = elementRegistry?.get?.(gatewayId);
          if (gateway) {
            modeling?.updateProperties?.(gateway, { name: nuevoNombre });
          }
          outgoing.forEach((flow, idx) => {
            const condicion = condiciones[idx]?.salida ?? '';
            if (flow && flow.id) {
              const flowElement = elementRegistry?.get?.(flow.id);
              if (flowElement) {
                modeling?.updateProperties?.(flowElement, { name: condicion });
              }
            }
          });
          window.alert('Condiciones guardadas');
        },
        error: (err) => window.alert(err?.error?.message ?? 'No se pudieron guardar las condiciones'),
      });
  }

  validar(): boolean {
    const registry = this.get('elementRegistry');
    const elements = registry?.getAll?.() ?? [];
    const startCount = elements.filter((e: any) => e.type === 'bpmn:StartEvent').length;
    const endCount = elements.filter((e: any) => e.type === 'bpmn:EndEvent').length;
    if (!startCount || !endCount) {
      window.alert('El diagrama debe tener al menos un nodo Inicio y un nodo Fin.');
      return false;
    }
    window.alert('Diagrama válido.');
    return true;
  }

  private toBpmnXml(value: string | null): string {
    if (!value) return this.blankDiagram();
    const v = value.trim();
    if (v.startsWith('<?xml') || v.includes('<bpmn:definitions')) return v;
    return this.blankDiagram();
  }

  private blankDiagram(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="160" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  }

  private get(name: string): any {
    return (this.modeler as any)?.get?.(name);
  }
}

