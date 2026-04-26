import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoColor',
  standalone: true,
})
export class EstadoColorPipe implements PipeTransform {
  transform(value: string | null): string {
    if (!value) return '#64748b';
    if (value.includes('COMPLET')) return '#10b981';
    if (value.includes('RECHAZ')) return '#ef4444';
    if (value.includes('PROCESO')) return '#4f46e5';
    return '#f59e0b';
  }
}
