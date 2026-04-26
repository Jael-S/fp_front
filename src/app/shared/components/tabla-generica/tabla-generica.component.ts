import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-tabla-generica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabla-generica.component.html',
  styleUrl: './tabla-generica.component.scss',
})
export class TablaGenericaComponent {
  readonly rows = input<Record<string, unknown>[]>([]);
  readonly columns = input<string[]>([]);
}
