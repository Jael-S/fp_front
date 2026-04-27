import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { DepartamentoService } from '../../../core/services/departamento.service';
import { TramiteService } from '../../../core/services/tramite.service';
import { Departamento } from '../../../core/models/departamento.model';
import { Politica } from '../../../core/models/politica.model';
import { EventoTramite, EstadoTramite, PrioridadTramite, Tramite, TramiteDetalle } from '../../../core/models/tramite.model';

@Component({
  selector: 'app-tramites',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tramites.component.html',
  styleUrl: './tramites.component.scss',
})
export class TramitesComponent {
  private readonly tramiteService = inject(TramiteService);
  private readonly departamentoService = inject(DepartamentoService);
  private readonly authService = inject(AuthService);

  @Input() mode: 'gestor' | 'admin' = 'gestor';

  readonly rows = signal<Tramite[]>([]);
  readonly departamentos = signal<Departamento[]>([]);
  readonly politicasActivas = signal<Politica[]>([]);
  readonly loading = signal(false);
  readonly openCreateModal = signal(false);
  readonly openDetailModal = signal(false);
  readonly detalle = signal<TramiteDetalle | null>(null);

  readonly q = signal('');
  readonly estado = signal('');
  readonly prioridad = signal('');
  readonly departamentoFiltro = signal('');

  readonly formPoliticaId = signal('');
  readonly formTitulo = signal('');
  readonly formPrioridad = signal<PrioridadTramite>('MEDIA');
  readonly formFechaLimite = signal('');
  readonly formClienteNombre = signal('');
  readonly formClienteIdentidad = signal('');
  readonly formCodigoSeguimiento = signal('');

  readonly user = computed(() => this.authService.getUser());
  readonly isGestor = computed(() => this.mode === 'gestor');
  readonly isAdmin = computed(() => this.mode === 'admin');

  constructor() {
    this.departamentoService.list(0, 200).subscribe({
      next: (res) => this.departamentos.set(res.items),
      error: () => this.departamentos.set([]),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: Record<string, string> = {};
    if (this.q().trim()) filters['q'] = this.q().trim();
    if (this.estado()) filters['estado'] = this.estado();
    if (this.prioridad()) filters['prioridad'] = this.prioridad();
    if (this.isGestor() && this.departamentoFiltro()) filters['departamentoId'] = this.departamentoFiltro();
    this.tramiteService.list(0, 100, filters).subscribe({
      next: (res) => {
        this.rows.set(res.items);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
      },
    });
  }

  openNuevo(): void {
    this.openCreateModal.set(true);
    this.formPoliticaId.set('');
    this.formTitulo.set('');
    this.formPrioridad.set('MEDIA');
    this.formFechaLimite.set('');
    this.formClienteNombre.set('');
    this.formClienteIdentidad.set('');
    this.formCodigoSeguimiento.set('');
    this.tramiteService.listPoliticasActivas().subscribe({
      next: (rows) => this.politicasActivas.set(rows),
      error: () => this.politicasActivas.set([]),
    });
  }

  closeNuevo(): void {
    this.openCreateModal.set(false);
  }

  crear(): void {
    if (!this.politicasActivas().length) {
      window.alert('No hay politicas activas. Active una politica primero.');
      return;
    }
    if (!this.formPoliticaId() || !this.formTitulo().trim() || !this.formFechaLimite()) {
      window.alert('Complete politica, titulo y fecha limite.');
      return;
    }
    this.tramiteService.create({
      politicaId: this.formPoliticaId(),
      titulo: this.formTitulo().trim(),
      prioridad: this.formPrioridad(),
      fechaLimite: new Date(this.formFechaLimite()).toISOString(),
      clienteNombre: this.formClienteNombre() || null,
      clienteIdentidad: this.formClienteIdentidad() || null,
      codigoSeguimiento: this.formCodigoSeguimiento() || null,
    }).subscribe({
      next: () => {
        this.closeNuevo();
        this.load();
      },
      error: (err) => window.alert(err?.error?.message ?? 'No se pudo crear el tramite'),
    });
  }

  verDetalle(id: string): void {
    this.tramiteService.getDetalleCompleto(id).subscribe({
      next: (res) => {
        this.detalle.set(res);
        this.openDetailModal.set(true);
      },
      error: (err) => window.alert(err?.error?.message ?? 'No se pudo cargar el detalle'),
    });
  }

  closeDetalle(): void {
    this.openDetailModal.set(false);
  }

  darDeBaja(id: string): void {
    if (!this.isGestor()) return;
    if (!window.confirm('Desea dar de baja este tramite?')) return;
    this.tramiteService.updateEstado(id, 'RECHAZADO').subscribe({
      next: () => this.load(),
      error: (err) => window.alert(err?.error?.message ?? 'No se pudo dar de baja el tramite'),
    });
  }

  deptoNombre(id: string | null): string {
    if (!id) return '-';
    return this.departamentos().find((d) => d.id === id)?.nombre ?? id;
  }

  priorityClass(value: PrioridadTramite): string {
    if (value === 'ALTA') return 'badge-alta';
    if (value === 'MEDIA') return 'badge-media';
    return 'badge-baja';
  }

  statusClass(value: EstadoTramite): string {
    if (value === 'COMPLETADO') return 'badge-completado';
    if (value === 'EN_PROCESO') return 'badge-proceso';
    if (value === 'RECHAZADO' || value === 'CANCELADO') return 'badge-rechazado';
    return 'badge-pendiente';
  }

  formatoFecha(value: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
  }

  codigoCorto(id: string): string {
    return id.slice(-6).toUpperCase();
  }

  isVencido(value: string | null): boolean {
    if (!value) return false;
    return new Date(value).getTime() < Date.now();
  }

  historialItems(): EventoTramite[] {
    return this.detalle()?.historial ?? [];
  }
}
