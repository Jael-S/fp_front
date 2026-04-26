import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DepartamentoService } from '../../../core/services/departamento.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Departamento } from '../../../core/models/departamento.model';
import { Usuario } from '../../../core/models/usuario.model';
import { DepartamentoFormComponent } from './departamento-form.component';

@Component({
  selector: 'app-departamentos-lista',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatDialogModule, MatPaginatorModule],
  templateUrl: './departamentos-lista.component.html',
  styleUrl: './departamentos-lista.component.scss',
})
export class DepartamentosListaComponent {
  private readonly departamentoService = inject(DepartamentoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['nombre', 'descripcion', 'responsable', 'usuarios', 'estado', 'acciones'];
  readonly rows = signal<Departamento[]>([]);
  readonly users = signal<Usuario[]>([]);
  readonly page = signal(0);
  readonly size = signal(10);
  readonly totalItems = signal(0);

  constructor() {
    this.usuarioService.list(0, 500).subscribe((res) => this.users.set(res.items));
    this.load();
  }

  load(): void {
    this.departamentoService.list(this.page(), this.size()).subscribe((res) => {
      this.rows.set(res.items);
      this.totalItems.set(res.totalItems);
    });
  }

  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.size.set(event.pageSize);
    this.load();
  }

  create(): void {
    const ref = this.dialog.open(DepartamentoFormComponent, {
      width: '560px',
      maxWidth: '92vw',
      disableClose: true,
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.departamentoService.create(payload).subscribe({
        next: () => this.load(),
        error: (err) => {
          const message = err?.error?.message ?? 'No se pudo crear el departamento';
          window.alert(message);
        },
      });
    });
  }

  edit(row: Departamento): void {
    const ref = this.dialog.open(DepartamentoFormComponent, {
      data: { departamento: row },
      width: '560px',
      maxWidth: '92vw',
      disableClose: true,
    });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.departamentoService.update(row.id, payload).subscribe({
        next: () => this.load(),
        error: (err) => {
          const message = err?.error?.message ?? 'No se pudo actualizar el departamento';
          window.alert(message);
        },
      });
    });
  }

  deactivate(row: Departamento): void {
    if (!row.activo) return;
    const ok = window.confirm(`Se desactivara ${row.nombre}. Deseas continuar?`);
    if (!ok) return;
    this.departamentoService.deactivate(row.id).subscribe(() => this.load());
  }

  responsableName(id: string): string {
    return this.users().find((u) => u.id === id)?.nombre ?? id;
  }
}
