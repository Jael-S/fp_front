import { AfterViewInit, Component, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UsuarioService } from '../../../core/services/usuario.service';
import { DepartamentoService } from '../../../core/services/departamento.service';
import { Usuario } from '../../../core/models/usuario.model';
import { Departamento } from '../../../core/models/departamento.model';
import { UsuarioFormComponent } from './usuario-form.component';
import { UsuarioUpdateRequest } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-usuarios-lista',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './usuarios-lista.component.html',
  styleUrl: './usuarios-lista.component.scss',
})
export class UsuariosListaComponent implements AfterViewInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly departamentoService = inject(DepartamentoService);
  private readonly dialog = inject(MatDialog);

  displayedColumns = ['nombre', 'email', 'rol', 'departamento', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Usuario>([]);
  departamentos = signal<Departamento[]>([]);
  selectedDepartamento = signal<string>('');
  totalItems = signal(0);
  page = signal(0);
  size = signal(10);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    this.departamentoService.list(0, 100).subscribe((res) => this.departamentos.set(res.items));
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  load(): void {
    this.usuarioService.list(this.page(), this.size(), this.selectedDepartamento() || undefined).subscribe((res) => {
      this.dataSource.data = res.items;
      this.totalItems.set(res.totalItems);
    });
  }

  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.size.set(event.pageSize);
    this.load();
  }

  create(): void {
    const ref = this.dialog.open(UsuarioFormComponent, { data: {} });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.usuarioService.create(payload).subscribe({
        next: () => { this.page.set(0); this.selectedDepartamento.set(''); this.load(); },
        error: (err) => window.alert(err?.error?.message ?? 'No se pudo crear el usuario'),
      });
    });
  }

  edit(usuario: Usuario): void {
    const ref = this.dialog.open(UsuarioFormComponent, { data: { usuario } });
    ref.afterClosed().subscribe((payload: UsuarioUpdateRequest) => {
      if (!payload) return;
      this.usuarioService.update(usuario.id, payload).subscribe({
        next: () => this.load(),
        error: (err) => window.alert(err?.error?.message ?? 'No se pudo actualizar el usuario'),
      });
    });
  }

  toggle(usuario: Usuario): void {
    if (usuario.activo) {
      const ok = window.confirm(`Se desactivara ${usuario.nombre}. Deseas continuar?`);
      if (!ok) return;
      this.usuarioService.deactivate(usuario.id).subscribe({
        next: () => this.load(),
        error: (err) => window.alert(err?.error?.message ?? 'No se pudo desactivar el usuario'),
      });
      return;
    }
    const payload: UsuarioUpdateRequest = {
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      departamentoId: usuario.departamentoId,
      activo: true,
    };
    this.usuarioService.update(usuario.id, payload).subscribe({
      next: () => this.load(),
      error: (err) => window.alert(err?.error?.message ?? 'No se pudo activar el usuario'),
    });
  }

  depName(id: string | null): string {
    if (!id) return '-';
    return this.departamentos().find((d) => d.id === id)?.nombre ?? id;
  }
}
