import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AfterViewInit, Component, OnDestroy, ViewEncapsulation, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import jsPDF from 'jspdf';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { Departamento } from '../../../core/models/departamento.model';
import { Formulario } from '../../../core/models/formulario.model';
import { DepartamentoService } from '../../../core/services/departamento.service';
import { FormularioService } from '../../../core/services/formulario.service';
import { TareaService } from '../../../core/services/tarea.service';
import { PoliticaService, type TransicionDiagramaGuardado } from '../../../core/services/politica.service';
import type { Politica } from '../../../core/models/politica.model';

// Extensión para bloquear edición directa en BPMN.js
const NoBpmnDirectEditModule = {
  __init__: [function(eventBus: any) {
    eventBus.on('element.dblclick', 1500, function(event: any) {
      const tipo = event?.element?.type;
      if (tipo === 'bpmn:Participant') {
        event.preventDefault?.();
      }
    });

    eventBus.on('directEditing.activate', 1500, function(event: any) {
      const tipo = event?.element?.type;
      if (tipo === 'bpmn:Participant') {
        event.preventDefault?.();
      }
    });
  }]
};

@Component({
  selector: 'app-diagrama-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule],
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
  private readonly tareaService = inject(TareaService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private modeler: BpmnModeler | null = null;
  private politica: Politica | null = null;
  departamentos: Departamento[] = [];
  private formularios: Formulario[] = [];
  isSaving = false;
  private politicaId: string | null = null;

  // ===== ESTADO DE MODALES =====
  // Modal: Seleccionar Departamento para Carril
  mostrandoSelectorCarril = false;
  departamentosDisponibles: Departamento[] = [];
  private carriSeleccionado: any = null;
  private esNuevoCarril = false;

  // Modal: Editar Tarea (nombre + departamento + formulario)
  mostrandoModalTarea = false;
  nombreTarea = '';
  departamentoSeleccionadoId: string | null = null;
  formularioSeleccionadoId: string | null = null;
  formulariosFiltrados: Formulario[] = [];
  private tareaSeleccionada: any = null;

  // Modal: Editar Decisión (condiciones + tipo de flujo)
  mostrandoModalDecision = false;
  decisionEtiqueta = '';
  tipoFlujo: 'SECUENCIAL' | 'ALTERNATIVO' | 'PARALELO' | 'ITERATIVO' = 'SECUENCIAL';
  decisionCondiciones: Array<{ id: string; salida: string }> = [];
  private decisionSeleccionada: any = null;

  // Modal: Editar Nombre
  mostrandoModalNombre = false;
  nombreNodo = '';
  private nodoSeleccionado: any = null;

  async ngAfterViewInit(): Promise<void> {
    this.politicaId = this.route.snapshot.paramMap.get('politicaId');
    if (!this.politicaId) {
      this.router.navigate(['/gestor/politicas']);
      return;
    setTimeout(() => {
  const svg = document.querySelector('#bpmn-canvas svg');
  if (svg) {
    const connectionsGroup = svg.querySelector('.djs-group[data-group-id="connections"]');
    if (connectionsGroup) {
      svg.appendChild(connectionsGroup);
    }
  }
  }, 1000);
    }
  
    this.initModeler();
    setTimeout(() => this.registerEventHandlers(), 100);

    this.departamentoService.list(0, 200).subscribe({
      next: (res) => (this.departamentos = res.items),
      error: () => (this.departamentos = []),
    });

    this.formularioService.listByPolitica(this.politicaId).subscribe({
      next: (res) => {
        this.formularios = res;
        console.log('✅ Formularios cargados en ngAfterViewInit:', this.formularios);
        if (!Array.isArray(this.formularios) || this.formularios.length === 0) {
          console.warn('⚠️ No hay formularios para esta política. Intentando cargar TODOS los formularios...');
          // Fallback: cargar todos los formularios sin filtro
          this.formularioService.list().subscribe({
            next: (allFormularios) => {
              this.formularios = allFormularios;
              console.log('✅ Todos los formularios cargados (fallback):', this.formularios);
            },
            error: (fallbackErr) => {
              console.error('❌ Error cargando formularios en fallback:', fallbackErr);
              this.formularios = [];
            }
          });
        }
      },
      error: (err) => {
        console.error('❌ Error cargando formularios en ngAfterViewInit:', err);
        console.log('Intentando fallback: cargar TODOS los formularios...');
        // Fallback: cargar todos los formularios sin filtro
        this.formularioService.list().subscribe({
          next: (allFormularios) => {
            this.formularios = allFormularios;
            console.log('✅ Todos los formularios cargados (fallback):', this.formularios);
          },
          error: (fallbackErr) => {
            console.error('❌ Error en fallback también:', fallbackErr);
            this.formularios = [];
          }
        });
      },
    });

    this.politicaService.getById(this.politicaId).subscribe({
      next: async (p) => {
        this.politica = p;
        await this.importSafeXml(this.toBpmnXml(p.diagramaJson));
        setTimeout(() => this.registerEventHandlers(), 100);
      },
      error: (err) => this.mostrarMensaje(err?.error?.message ?? 'No se pudo cargar la política', true),
    });
  }

  // ===== MÉTODO HELPER: MOSTRAR MENSAJES =====
  private mostrarMensaje(mensaje: string, esError: boolean = false, duracion: number = 3000): void {
    const panelClass = esError ? ['error-snackbar'] : ['success-snackbar'];
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: duracion,
      panelClass,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
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
      additionalModules: [NoBpmnDirectEditModule],
    });
  }

  // ===== REGISTRO DE EVENT HANDLERS =====
  private registerEventHandlers(): void {
    const eventBus = this.get('eventBus');
    if (!eventBus) return;

    // ===== CLICK SIMPLE =====
    eventBus.on('element.click', (event: any) => {
      const element = event?.element;
      if (!element?.type) return;

      this.ngZone.run(() => {
        const tipo = element.type;

        // Carril: abrir selector de departamento
        if (tipo === 'bpmn:Participant') {
          this.abrirSelectorCarril(element);
          return;
        }

        // Tarea: abrir modal de formulario
        if (tipo === 'bpmn:Task') {
          void this.abrirModalFormulario(element);
          return;
        }

        // Decisión: abrir modal de condiciones
        if (tipo === 'bpmn:ExclusiveGateway') {
          this.abrirModalDecision(element);
          return;
        }
      });
    });

    // ===== DOBLE CLICK =====
    eventBus.on('element.dblclick', (event: any) => {
      const element = event?.element;
      if (!element?.type) return;

      this.ngZone.run(() => {
        // Todos los nodos pueden editar nombre con doble click
        this.abrirModalNombre(element);
      });
    });

    // ===== CREAR NUEVO PARTICIPANT =====
    eventBus.on('shape.create', (event: any) => {
      const shape = event?.context?.shape || event?.shape;
      if (shape?.type === 'bpmn:Participant') {
        event.preventDefault?.();
        this.ngZone.run(() => {
          this.carriSeleccionado = shape;
          this.esNuevoCarril = true;
          this.abrirSelectorCarrilModal();
        });
      }
    });

    // ===== FALLBACK PARTICIPANT SIN NOMBRE =====
    eventBus.on('shape.added', (event: any) => {
      const element = event?.element;
      if (element?.type === 'bpmn:Participant' && !element?.businessObject?.name?.trim()) {
        setTimeout(() => {
          this.ngZone.run(() => {
            this.carriSeleccionado = element;
            this.esNuevoCarril = true;
            this.abrirSelectorCarrilModal();
          });
        }, 100);
      }
    });

    this.registerCrossLaneConnectionRules();
  }

  /**
   * Prioridad máxima para permitir SequenceFlow entre cualquier elemento
   * en distintos carriles, incluyendo ExclusiveGateway → Task cross-lane.
   */
  private registerCrossLaneConnectionRules(): void {
    const rules = this.get('rules') as { addRule?: (name: string, priority: number, fn: (ctx: any) => unknown) => void } | null;
    if (!rules?.addRule) return;
    try {
      rules.addRule('connection.create', 999999, (context: any) => {
        const source = context?.source;
        const target = context?.target;
        if (!source || !target) return false;
        // Bloquear solo conexiones directas Participante → Participante
        if (source.type === 'bpmn:Participant' && target.type === 'bpmn:Participant') return false;
        // Permitir cualquier conexión donde ninguno sea Participante
        if (source.type !== 'bpmn:Participant' && target.type !== 'bpmn:Participant') {
          return { type: 'bpmn:SequenceFlow' };
        }
        // Permitir explícitamente si alguno es Gateway (cross-lane desde/hacia decisión)
        if (source.type === 'bpmn:ExclusiveGateway' || target.type === 'bpmn:ExclusiveGateway') {
          return { type: 'bpmn:SequenceFlow' };
        }
        return false;
      });
    } catch {
      // Si la versión de diagram-js cambia la API de rules, no bloquear el editor
    }
  }

  // ===== SELECTOR CARRIL (DEPARTAMENTO) =====
  private abrirSelectorCarril(element: any): void {
    this.carriSeleccionado = element;
    this.esNuevoCarril = false;
    this.abrirSelectorCarrilModal();
  }

  private abrirSelectorCarrilModal(): void {
    const carrilesExistentes = this.obtenerNombresCarrilesDelDiagrama();
    let nombres = carrilesExistentes;

    // Si editamos, excluir el nombre actual
    if (!this.esNuevoCarril && this.carriSeleccionado?.businessObject?.name) {
      nombres = nombres.filter(
        (n) => n.toLowerCase() !== this.carriSeleccionado.businessObject.name.toLowerCase()
      );
    }

    this.departamentosDisponibles = this.departamentos.filter(
      (d) => !nombres.some((carril) => carril.toLowerCase() === d.nombre.toLowerCase())
    );

    if (!this.departamentosDisponibles.length) {
      window.alert('No hay departamentos disponibles');
      return;
    }

    this.mostrandoSelectorCarril = true;
    this.cdr.detectChanges();
  }

  seleccionarDepartamento(dept: Departamento): void {
    this.ngZone.run(async () => {
      if (!this.carriSeleccionado) return;

      const carrilId = this.carriSeleccionado.id;
      const carrilNombre = dept.nombre;

      const modeling = this.get('modeling');
      if (modeling) {
        // Guardar nombre + departamentoId en el businessObject
        modeling.updateProperties(this.carriSeleccionado, { 
          name: dept.nombre,
          departamentoId: dept.id
        });
        
        // También guardar en la variable de referencia para que abrirModalTarea lo encuentre
        if (this.carriSeleccionado?.businessObject) {
          this.carriSeleccionado.businessObject.departamentoId = dept.id;
        }
      }

      // Guardar relación en backend
      if (this.politicaId) {
        try {
          await this.tareaService.guardarRelacionCarril(this.politicaId, {
            carrilId,
            carrilNombre,
            departamentoId: dept.id,
            departamentoNombre: dept.nombre
          }).toPromise();
          console.log('Relación carril-departamento guardada en backend');
        } catch (error) {
          console.error('Error al guardar relación carril-departamento:', error);
          // No bloqueamos el flujo si falla el guardado
        }
      }

      this.cerrarSelectorCarril();
      this.cdr.detectChanges();
    });
  }

  cancelarSelectorCarril(): void {
    this.ngZone.run(() => {
      if (this.esNuevoCarril && this.carriSeleccionado) {
        const modeling = this.get('modeling');
        if (modeling) {
          modeling.removeShape(this.carriSeleccionado);
        }
      }
      this.cerrarSelectorCarril();
      this.cdr.detectChanges();
    });
  }

  private cerrarSelectorCarril(): void {
    this.mostrandoSelectorCarril = false;
    this.departamentosDisponibles = [];
    this.carriSeleccionado = null;
    this.esNuevoCarril = false;
  }

  // ===== MODAL TAREA (NOMBRE + DEPARTAMENTO + FORMULARIO) =====
  private async abrirModalTarea(taskElement: any): Promise<void> {
    this.tareaSeleccionada = taskElement;
    this.nombreTarea = taskElement?.businessObject?.name || '';
    this.departamentoSeleccionadoId = null;
    this.formularioSeleccionadoId = null;
    this.formulariosFiltrados = [];

    if (this.politicaId) {
      try {
        const nodo = await firstValueFrom(
          this.tareaService.obtenerNodoPorElementoYPolitica(taskElement.id, this.politicaId)
        );
        if (nodo?.departamentoId) {
          this.departamentoSeleccionadoId = nodo.departamentoId;
          try {
            const list = await firstValueFrom(
              this.formularioService.listarPorDepartamento(nodo.departamentoId)
            );
            this.formulariosFiltrados = Array.isArray(list) ? list : [];
          } catch {
            this.formulariosFiltrados = [];
          }
        }
        if (nodo?.formularioId) {
          this.formularioSeleccionadoId = nodo.formularioId;
        }
      } catch {
        // Sin nodo persistido aún o error de red
      }
    }

    this.mostrandoModalTarea = true;
    this.cdr.detectChanges();
  }

  onDepartamentoChange(resetFormulario = true): void {
    if (resetFormulario) {
      this.formularioSeleccionadoId = null;
    }
    if (!this.departamentoSeleccionadoId) {
      this.formulariosFiltrados = [];
      this.cdr.detectChanges();
      return;
    }
    this.formularioService.listarPorDepartamento(this.departamentoSeleccionadoId).subscribe({
      next: (formularios) => {
        this.formulariosFiltrados = Array.isArray(formularios) ? formularios : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.formulariosFiltrados = [];
        this.mostrarMensaje('No se pudieron cargar los formularios del departamento', true);
        this.cdr.detectChanges();
      },
    });
  }

  guardarTarea(): void {
    this.ngZone.run(async () => {
      if (!this.tareaSeleccionada || !this.politicaId) return;

      if (this.formularioSeleccionadoId && !this.departamentoSeleccionadoId) {
        this.mostrarMensaje('Seleccione un departamento para asignar un formulario', true);
        return;
      }

      const modeling = this.get('modeling');
      if (modeling) {
        modeling.updateProperties(this.tareaSeleccionada, { name: this.nombreTarea });
      }

      try {
        await firstValueFrom(
          this.tareaService.configurarNodoPorElementId(this.tareaSeleccionada.id, {
            politicaId: this.politicaId,
            nombre: this.nombreTarea,
            departamentoId: this.departamentoSeleccionadoId,
            formularioId: this.formularioSeleccionadoId,
          })
        );
        this.mostrarMensaje(`Tarea "${this.nombreTarea}" guardada`);
      } catch (err: any) {
        console.error('Error al guardar configuración de tarea:', err);
        this.mostrarMensaje(err?.error?.message ?? 'Error al guardar la tarea', true);
      }

      this.cerrarModalTarea();
      this.cdr.detectChanges();
    });
  }

  cancelarModalTarea(): void {
    this.cerrarModalTarea();
  }

  private cerrarModalTarea(): void {
    this.mostrandoModalTarea = false;
    this.nombreTarea = '';
    this.departamentoSeleccionadoId = null;
    this.formularioSeleccionadoId = null;
    this.formulariosFiltrados = [];
    this.tareaSeleccionada = null;
  }

  // ===== MÉTODOS LEGACY (MANTENER POR COMPATIBILIDAD) =====
  private abrirModalFormulario(taskElement: any): Promise<void> {
    return this.abrirModalTarea(taskElement);
  }

  asignarFormulario(formulario: Formulario): void {
    this.ngZone.run(() => {
      if (!this.tareaSeleccionada) return;
      this.formularioSeleccionadoId = formulario.id;
      this.guardarTarea();
    });
  }

  cancelarModalFormulario(): void {
    this.cerrarModalTarea();
  }

  private cerrarModalFormulario(): void {
    this.cerrarModalTarea();
  }

  // ===== MODAL DECISIÓN (CONDICIONES + TIPO DE FLUJO) =====
  private abrirModalDecision(gatewayElement: any): void {
    this.decisionSeleccionada = gatewayElement;
    this.decisionEtiqueta = gatewayElement?.businessObject?.name || '';
    this.tipoFlujo = gatewayElement?.businessObject?.tipoFlujo || 'SECUENCIAL';

    // Obtener las salidas (flechas) del gateway
    const outgoing: any[] = gatewayElement?.businessObject?.outgoing || [];
    this.decisionCondiciones = outgoing.map((flow: any) => ({
      id: flow.id,
      salida: flow.name || '',
    }));

    this.mostrandoModalDecision = true;
    this.cdr.detectChanges();
  }

  guardarDecision(): void {
    this.ngZone.run(async () => {
      if (!this.decisionSeleccionada) return;

      const modeling = this.get('modeling');
      const elementRegistry = this.get('elementRegistry');

      // Actualizar etiqueta del gateway
      if (modeling) {
        modeling.updateProperties(this.decisionSeleccionada, { 
          name: this.decisionEtiqueta,
          tipoFlujo: this.tipoFlujo
        });
      }

      // Actualizar etiquetas de las flechas (flows)
      this.decisionCondiciones.forEach((cond) => {
        const flow = elementRegistry?.get?.(cond.id);
        if (flow && modeling) {
          modeling.updateProperties(flow, { name: cond.salida });
        }
      });

      // Guardar tipo de flujo en backend (elementId + politicaId)
      try {
        if (!this.politicaId) {
          throw new Error('politicaId no disponible');
        }
        await firstValueFrom(
          this.tareaService.actualizarTipoFlujo(this.decisionSeleccionada.id, this.tipoFlujo, this.politicaId)
        );
        this.mostrarMensaje(`Decisión guardada con tipo: ${this.tipoFlujo}`);
      } catch (err: any) {
        console.error('Error al guardar tipo de flujo:', err);
        this.mostrarMensaje('Decisión guardada localmente (tipo de flujo pendiente de sincronizar)', false, 2000);
      }

      this.cerrarModalDecision();
      this.cdr.detectChanges();
    });
  }

  cancelarModalDecision(): void {
    this.cerrarModalDecision();
  }

  private cerrarModalDecision(): void {
    this.mostrandoModalDecision = false;
    this.decisionEtiqueta = '';
    this.tipoFlujo = 'SECUENCIAL';
    this.decisionCondiciones = [];
    this.decisionSeleccionada = null;
  }

  // ===== MODAL EDITAR NOMBRE =====
  private abrirModalNombre(nodo: any): void {
    this.nodoSeleccionado = nodo;
    this.nombreNodo = nodo?.businessObject?.name || '';
    this.mostrandoModalNombre = true;
    this.cdr.detectChanges();
  }

  guardarNombre(): void {
    this.ngZone.run(() => {
      if (!this.nodoSeleccionado) return;

      const modeling = this.get('modeling');
      if (modeling) {
        modeling.updateProperties(this.nodoSeleccionado, { name: this.nombreNodo });
      }

      this.cerrarModalNombre();
      this.cdr.detectChanges();
    });
  }

  cancelarModalNombre(): void {
    this.cerrarModalNombre();
  }

  private cerrarModalNombre(): void {
    this.mostrandoModalNombre = false;
    this.nombreNodo = '';
    this.nodoSeleccionado = null;
  }

  // ===== HELPERS =====
  private obtenerNombresCarrilesDelDiagrama(): string[] {
    try {
      const registry = this.get('elementRegistry');
      const elements = registry?.getAll?.() ?? [];
      const participants = elements.filter((e: any) => e.type === 'bpmn:Participant');
      return participants
        .map((p: any) => p?.businessObject?.name?.trim() || '')
        .filter((name: string) => name.length > 0);
    } catch {
      return [];
    }
  }

  private obtenerCarrilDeTarea(taskElement: any): any {
    try {
      // Buscar el parent lane del elemento
      let parent = taskElement?.parent;
      while (parent) {
        if (parent.type === 'bpmn:Lane' || parent.type === 'bpmn:Participant') {
          return parent;
        }
        parent = parent?.parent;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Obtener el nombre del carril (para compatibilidad con código antiguo)
   */
  private obtenerNombreCarril(taskElement: any): string | null {
    const carril = this.obtenerCarrilDeTarea(taskElement);
    return carril?.businessObject?.name || null;
  }

  // ===== OPERACIONES ESTÁNDAR =====
  private async importSafeXml(xml: string): Promise<void> {
    if (!this.modeler) return;
    try {
      await this.modeler.importXML(xml);
    } catch {
      await this.modeler.importXML(this.blankDiagram());
    }
    this.autoLayout();
  }

  /**
   * Flechas BPMN (elementId origen/destino) para persistir transiciones junto al XML.
   * Incluye SequenceFlow (línea continua) y MessageFlow (línea punteada entre carriles).
   */
  private extraerTransicionesDelModelo(): TransicionDiagramaGuardado[] {
    const registry = this.get('elementRegistry');
    const all = registry?.getAll?.() ?? [];
    const flows = all.filter((el: any) =>
      el?.type === 'bpmn:SequenceFlow' || el?.type === 'bpmn:MessageFlow'
    );
    return flows.map((conn: any) => {
      const bo = conn?.businessObject;
      const srcRef = bo?.sourceRef;
      const tgtRef = bo?.targetRef;
      const srcId = typeof srcRef === 'object' && srcRef?.id ? srcRef.id : String(srcRef ?? '');
      const tgtId = typeof tgtRef === 'object' && tgtRef?.id ? tgtRef.id : String(tgtRef ?? '');
      const origenEl = srcId ? registry?.get?.(srcId) : null;
      let tipoOrigen = 'SECUENCIAL';
      if (origenEl?.type === 'bpmn:ParallelGateway') {
        tipoOrigen = 'PARALELO';
      } else if (origenEl?.type === 'bpmn:ExclusiveGateway' || origenEl?.type === 'bpmn:InclusiveGateway') {
        tipoOrigen = 'ALTERNATIVO';
      }
      const etiqueta = bo?.name && String(bo.name).trim() ? String(bo.name).trim() : null;
      return {
        nodoOrigenId: srcId,
        nodoDestinoId: tgtId,
        etiqueta,
        tipo: tipoOrigen,
      };
    });
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

      const transiciones = this.extraerTransicionesDelModelo();
      this.politicaService.guardarDiagramaCompleto(politica.id, xml, transiciones).subscribe({
        next: (updated) => {
          this.politica = { ...politica, diagramaJson: xml };
          this.isSaving = false;
          window.alert('Diagrama guardado');
        },
        error: (err) => {
          this.isSaving = false;
          window.alert(err?.error?.message ?? 'No se pudo guardar');
        },
      });
    } catch {
      this.isSaving = false;
      window.alert('No se pudo exportar el diagrama');
    }
  }

  autoLayout(): void {
    const canvas = this.get('canvas');
    if (canvas) canvas.zoom('fit-viewport');
  }

  zoomIn(): void {
    const canvas = this.get('canvas');
    if (!canvas) return;
    const current = Number(canvas.zoom?.() ?? 1);
    if (Number.isFinite(current)) canvas.zoom(current * 1.1);
  }

  zoomOut(): void {
    const canvas = this.get('canvas');
    if (!canvas) return;
    const current = Number(canvas.zoom?.() ?? 1);
    if (Number.isFinite(current)) canvas.zoom(Math.max(0.2, current * 0.9));
  }

  resetZoom(): void {
    const canvas = this.get('canvas');
    if (canvas) canvas.zoom(1);
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
      a.download = `diagrama-${this.politica?.id}.png`;
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
      pdf.save(`diagrama-${this.politica?.id}.pdf`);
    };
    img.src = url;
  }

  // ===== CREAR NUEVO FORMULARIO =====
  crearNuevoFormulario(): void {
    // Mostrar mensaje informativo
    this.mostrarMensaje('Por favor, crear formulario desde el módulo de Formularios y luego recargar esta página', false, 5000);
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
