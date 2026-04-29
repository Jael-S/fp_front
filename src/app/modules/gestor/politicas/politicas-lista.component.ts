import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { PoliticaService } from '../../../core/services/politica.service';
import { TramiteService } from '../../../core/services/tramite.service';
import { EstadoPolitica, Politica } from '../../../core/models/politica.model';
import { PoliticaFormComponent } from './politica-form.component';

@Component({
  selector: 'app-politicas-lista',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './politicas-lista.component.html',
  styleUrl: './politicas-lista.component.scss',
})
export class PoliticasListaComponent {
  private readonly politicaService = inject(PoliticaService);
  private readonly tramiteService = inject(TramiteService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  rows = signal<Politica[]>([]);
  estado = signal<EstadoPolitica | ''>('');
  tramitesPorPolitica = signal<Map<string, number>>(new Map());

  constructor() {
    this.load();
  }

  load(): void {
    this.politicaService.list(0, 100, this.estado() || undefined).subscribe((res) => {
      this.rows.set(res.items);
      
      // Cargar cantidad de trámites pendientes por política
      const map = new Map<string, number>();
      res.items.forEach((politica) => {
        this.tramiteService.list(0, 1000, { politicaId: politica.id }).subscribe({
          next: (tramites) => {
            const pendientes = tramites.items.filter(
              (t) => t.estado === 'PENDIENTE' || t.estado === 'EN_PROCESO'
            ).length;
            map.set(politica.id, pendientes);
            this.tramitesPorPolitica.set(new Map(map));
          },
          error: () => {
            map.set(politica.id, 0);
            this.tramitesPorPolitica.set(new Map(map));
          },
        });
      });
    });
  }

  create(): void {
    const ref = this.dialog.open(PoliticaFormComponent);
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.politicaService.create(payload).subscribe({
        next: () => this.load(),
        error: (err) => window.alert(err?.error?.message ?? 'No se pudo crear la politica'),
      });
    });
  }

  edit(row: Politica): void {
    const ref = this.dialog.open(PoliticaFormComponent, { data: { politica: row } });
    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.politicaService.update(row.id, payload).subscribe({
        next: () => this.load(),
        error: (err) => window.alert(err?.error?.message ?? 'No se pudo actualizar la politica'),
      });
    });
  }

  activate(row: Politica): void {
    this.politicaService.activate(row.id).subscribe({
      next: () => this.load(),
      error: (err) => window.alert(err?.error?.message ?? 'No se pudo activar la politica'),
    });
  }

  deactivate(row: Politica): void {
    // Verificar si hay trámites pendientes para esta política
    this.tramiteService.list(0, 1000, { politicaId: row.id }).subscribe({
      next: (res) => {
        const tramitesPendientes = res.items.filter(
          (t) => t.estado === 'PENDIENTE' || t.estado === 'EN_PROCESO'
        );
        
        if (tramitesPendientes.length > 0) {
          window.alert(
            `No se puede desactivar la política "${row.nombre}" porque hay ${tramitesPendientes.length} trámite(s) pendiente(s) o en proceso.`
          );
          return;
        }
        
        // Si no hay trámites pendientes, proceder con la desactivación
        this.politicaService.deactivate(row.id).subscribe({
          next: () => this.load(),
          error: (err) => window.alert(err?.error?.message ?? 'No se pudo desactivar la politica'),
        });
      },
      error: () => {
        window.alert('Error al verificar trámites pendientes');
      },
    });
  }

  remove(row: Politica): void {
    const ok = window.confirm(`Eliminar politica "${row.nombre}"?`);
    if (!ok) return;
    this.politicaService.delete(row.id).subscribe({
      next: () => this.load(),
      error: (err) => window.alert(err?.error?.message ?? 'No se pudo eliminar la politica'),
    });
  }

  openDiagram(row: Politica): void {
    this.router.navigate(['/gestor/diagrama', row.id]);
  }

  puedeDesactivar(row: Politica): boolean {
    if (row.estado !== 'ACTIVA') return false;
    const tramitesPendientes = this.tramitesPorPolitica().get(row.id) ?? 0;
    return tramitesPendientes === 0;
  }

}
