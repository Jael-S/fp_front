import { Component, computed, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatBadgeModule, MatButtonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly router = inject(Router);
  readonly user = computed(() => this.authService.getUser());
  count = 0;

  constructor() {
    this.notificacionService.countNoLeidas().subscribe((value) => (this.count = value));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
