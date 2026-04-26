import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Departamento } from '../../../core/models/departamento.model';
import type { Formulario } from '../../../core/models/formulario.model';
import { DepartamentoService } from '../../../core/services/departamento.service';
import { FormularioService } from '../../../core/services/formulario.service';
import type {
  GatewayCondition,
  GatewayProps,
  SelectedElementVM,
  TaskProps,
  TaskPriority,
} from '../../../core/services/diagrama-bpmn.service';
import { DiagramaBpmnService } from '../../../core/services/diagrama-bpmn.service';

@Component({
  selector: 'app-panel-propiedades',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-propiedades.component.html',
  styleUrl: './panel-propiedades.component.scss',
})
export class PanelPropiedadesComponent implements OnChanges {
  private readonly diagrama = inject(DiagramaBpmnService);
  private readonly deptService = inject(DepartamentoService);
  private readonly formularioService = inject(FormularioService);

  @Input({ required: true }) politicaId!: string;
  @Input({ required: true }) selected!: SelectedElementVM | null;

  @Output() readonly saved = new EventEmitter<void>();

  readonly departamentos = signal<Departamento[]>([]);
  readonly formularios = signal<Formulario[]>([]);

  readonly editMode = signal(false);

  readonly taskDraft = signal<TaskProps | null>(null);
  readonly gwDraft = signal<GatewayProps | null>(null);

  constructor() {
    this.loadDepartamentos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selected']) this.onSelectionChanged();
  }

  onSelectionChanged(): void {
    this.editMode.set(false);
    const sel = this.selected;
    if (!sel) {
      this.taskDraft.set(null);
      this.gwDraft.set(null);
      return;
    }

    if (sel.type === 'bpmn:Task') {
      this.taskDraft.set(this.diagrama.getTaskProps(sel.id));
      this.gwDraft.set(null);
      this.loadFormularios(sel.id);
      return;
    }

    if (sel.type === 'bpmn:ExclusiveGateway' || sel.type === 'bpmn:InclusiveGateway') {
      this.gwDraft.set(this.diagrama.getGatewayProps(sel.id));
      this.taskDraft.set(null);
      return;
    }

    this.taskDraft.set(null);
    this.gwDraft.set(null);
  }

  enableEdit(): void {
    if (!this.selected) return;
    this.editMode.set(true);
  }

  cancel(): void {
    this.editMode.set(false);
    this.onSelectionChanged();
  }

  saveTask(): void {
    const sel = this.selected;
    const draft = this.taskDraft();
    if (!sel || sel.type !== 'bpmn:Task' || !draft) return;
    this.diagrama.setTaskProps(sel.id, draft);
    this.editMode.set(false);
    this.saved.emit();
  }

  saveGateway(): void {
    const sel = this.selected;
    const draft = this.gwDraft();
    if (!sel) return;
    if (sel.type !== 'bpmn:ExclusiveGateway' && sel.type !== 'bpmn:InclusiveGateway') return;
    if (!draft) return;
    this.diagrama.setGatewayProps(sel.id, draft);
    this.editMode.set(false);
    this.saved.emit();
  }

  setPriority(p: TaskPriority): void {
    const d = this.taskDraft();
    if (!d) return;
    this.taskDraft.set({ ...d, prioridad: p });
  }

  addCondition(): void {
    const d = this.gwDraft();
    if (!d) return;
    const next: GatewayCondition = {
      id: crypto.randomUUID(),
      label: '',
      expression: '',
    };
    this.gwDraft.set({ ...d, condiciones: [...d.condiciones, next] });
  }

  removeCondition(id: string): void {
    const d = this.gwDraft();
    if (!d) return;
    this.gwDraft.set({ ...d, condiciones: d.condiciones.filter((c) => c.id !== id) });
  }

  private loadDepartamentos(): void {
    this.deptService.list(0, 200).subscribe({
      next: (page) => this.departamentos.set(page.items ?? []),
      error: () => this.departamentos.set([]),
    });
  }

  private loadFormularios(nodoId: string): void {
    // Backend soporta formularios por nodo
    this.formularioService.getByNodoId(nodoId).subscribe({
      next: (list) => this.formularios.set(list ?? []),
      error: () => this.formularios.set([]),
    });
  }
}

