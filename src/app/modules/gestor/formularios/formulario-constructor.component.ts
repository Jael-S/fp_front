import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Departamento } from '../../../core/models/departamento.model';
import { FormularioService } from '../../../core/services/formulario.service';
import { AuthService } from '../../../core/services/auth.service';
import { DepartamentoService } from '../../../core/services/departamento.service';
import { Campo, CampoTipo, Formulario } from '../../../core/models/formulario.model';

@Component({
  selector: 'app-formulario-constructor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './formulario-constructor.component.html',
  styleUrl: './formulario-constructor.component.scss',
})
export class FormularioConstructorComponent {
  private readonly formularioService = inject(FormularioService);
  private readonly departamentoService = inject(DepartamentoService);
  private readonly authService = inject(AuthService);

  @Input() mode: 'gestor' | 'admin' = 'gestor';

  readonly tipos: CampoTipo[] = ['TEXTO', 'NUMERO', 'FECHA', 'SELECCION', 'ARCHIVO', 'IMAGEN'];
  readonly formularios = signal<Formulario[]>([]);
  readonly departamentos = signal<Departamento[]>([]);
  readonly loading = signal(false);
  readonly search = signal('');
  readonly selectedDepartamentoId = signal('');
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly nombre = signal('');
  readonly descripcion = signal('');
  readonly campos = signal<Campo[]>([]);

  readonly user = computed(() => this.authService.getUser());
  readonly isGestor = computed(() => this.mode === 'gestor');
  readonly isAdmin = computed(() => this.mode === 'admin');

  constructor() {
    this.bootstrap();
  }

  private bootstrap(): void {
    this.departamentoService.list(0, 200).subscribe({
      next: (res) => {
        this.departamentos.set(res.items);
        const userDepartamentoId = this.user()?.departamentoId ?? '';
        if (this.isAdmin()) {
          this.selectedDepartamentoId.set(userDepartamentoId);
        } else if (res.items.length) {
          this.selectedDepartamentoId.set(res.items[0].id);
        }
        this.loadFormularios();
      },
      error: () => {
        this.departamentos.set([]);
        this.loadFormularios();
      },
    });
  }

  loadFormularios(): void {
    this.loading.set(true);
    const departamentoFiltro = this.isAdmin() ? this.user()?.departamentoId ?? undefined : undefined;
    this.formularioService.list(departamentoFiltro, this.search()).subscribe({
      next: (rows) => {
        this.formularios.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.formularios.set([]);
      },
    });
  }

  applySearch(value: string): void {
    this.search.set(value);
    this.loadFormularios();
  }

  openCreate(): void {
    const depto = this.resolveDepartamentoEditor();
    if (!depto) {
      window.alert('Seleccione un departamento para crear el formulario.');
      return;
    }
    this.editorOpen.set(true);
    this.editingId.set(null);
    this.nombre.set('');
    this.descripcion.set('');
    this.campos.set([]);
    this.selectedDepartamentoId.set(depto);
  }

  openEdit(item: Formulario): void {
    this.editorOpen.set(true);
    this.editingId.set(item.id);
    this.nombre.set(item.nombre);
    this.descripcion.set(item.descripcion ?? '');
    this.selectedDepartamentoId.set(item.departamentoId ?? this.resolveDepartamentoEditor());
    this.campos.set((item.campos ?? []).map((campo) => ({ ...campo, opciones: campo.opciones ?? [] })));
  }

  cancelEditor(): void {
    this.editorOpen.set(false);
  }

  addCampo(tipo: CampoTipo): void {
    this.campos.update((prev) => [
      ...prev,
      { nombre: `campo_${prev.length + 1}`, etiqueta: 'Nuevo campo', tipo, requerido: false, opciones: [] },
    ]);
  }

  removeCampo(index: number): void {
    this.campos.update((prev) => prev.filter((_, i) => i !== index));
  }

  reorderCampo(event: CdkDragDrop<Campo[]>): void {
    const next = [...this.campos()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.campos.set(next);
  }

  save(): void {
    const departamentoId = this.resolveDepartamentoEditor();
    if (!this.nombre().trim()) {
      window.alert('Ingrese nombre del formulario.');
      return;
    }
    if (!departamentoId) {
      window.alert('No hay departamento asociado para guardar el formulario.');
      return;
    }
    if (this.campos().length === 0) {
      window.alert('Agregue al menos un campo.');
      return;
    }

    const payload = {
      nombre: this.nombre().trim(),
      descripcion: this.descripcion().trim() || null,
      departamentoId,
      politicaId: null,
      nodoId: null,
      campos: this.campos(),
    };

    const id = this.editingId();
    const request$ = id ? this.formularioService.update(id, payload) : this.formularioService.create(payload);
    request$.subscribe({
      next: () => {
        this.editorOpen.set(false);
        this.loadFormularios();
      },
      error: (err) => window.alert(err?.error?.message ?? 'No se pudo guardar el formulario'),
    });
  }

  delete(item: Formulario): void {
    if (!window.confirm(`Desea desactivar el formulario "${item.nombre}"?`)) return;
    this.formularioService.delete(item.id).subscribe({
      next: () => this.loadFormularios(),
      error: (err) => window.alert(err?.error?.message ?? 'No se pudo eliminar el formulario'),
    });
  }

  departamentoNombre(id: string | null): string {
    if (!id) return '-';
    return this.departamentos().find((d) => d.id === id)?.nombre ?? id;
  }

  parseOptions(value: string): string[] {
    return (value || '')
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
  }

  private resolveDepartamentoEditor(): string {
    if (this.isAdmin()) {
      return this.user()?.departamentoId ?? '';
    }
    return this.selectedDepartamentoId();
  }
}
