import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { FormularioService } from '../../../core/services/formulario.service';
import { Campo, CampoTipo } from '../../../core/models/formulario.model';

@Component({
  selector: 'app-formulario-constructor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
  ],
  templateUrl: './formulario-constructor.component.html',
  styleUrl: './formulario-constructor.component.scss',
})
export class FormularioConstructorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly formularioService = inject(FormularioService);
  readonly politicaId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly tipos: CampoTipo[] = ['TEXTO', 'NUMERO', 'FECHA', 'SELECCION', 'ARCHIVO', 'IMAGEN'];
  readonly campos = signal<Campo[]>([]);
  readonly nombre = signal('');
  readonly nodoId = signal('');
  readonly formularios = signal<any[]>([]);

  constructor() {
    if (this.politicaId) {
      this.refresh();
    }
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

  save(): void {
    if (!this.nombre() || !this.nodoId() || this.campos().length === 0) return;
    this.formularioService
      .create({
        politicaId: this.politicaId,
        nodoId: this.nodoId(),
        nombre: this.nombre(),
        campos: this.campos(),
      })
      .subscribe(() => {
        this.campos.set([]);
        this.nombre.set('');
        this.refresh();
      });
  }

  refresh(): void {
    if (!this.nodoId()) return;
    this.formularioService.getByNodoId(this.nodoId()).subscribe((rows) => this.formularios.set(rows));
  }

  parseOptions(value: string): string[] {
    return (value || '')
        .split(',')
        .map((x) => x.trim())
        .filter((x) => x.length > 0);
  }
}
