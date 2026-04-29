import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { catchError, of, startWith } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly router = inject(Router);
  readonly user = computed(() => this.authService.getUser());
  readonly count$ = this.notificacionService.countNoLeidas().pipe(
    startWith(0),
    catchError(() => of(0))
  );

  toggleNotificaciones(): void {
    this.router.navigate(['/funcionario/historial']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
