import { Component } from '@angular/core';
import { IaService } from '../../../core/services/ia.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { inject, signal } from '@angular/core';

@Component({
  selector: 'app-asistente-ia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistente-ia.component.html',
  styleUrl: './asistente-ia.component.scss',
})
export class AsistenteIaComponent {
  private readonly iaService = inject(IaService);
  readonly messages = signal<{ role: 'user' | 'assistant'; text: string }[]>([]);
  input = '';

  send(): void {
    const text = this.input.trim();
    if (!text) return;
    this.input = '';
    this.messages.update((m) => [...m, { role: 'user', text }]);
    this.iaService.preguntar(text).subscribe((res) => {
      const answer = (res as any)?.respuesta ?? JSON.stringify(res);
      this.messages.update((m) => [...m, { role: 'assistant', text: String(answer) }]);
    });
  }
}
