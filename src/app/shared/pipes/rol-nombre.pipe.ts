import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rolNombre',
  standalone: true,
})
export class RolNombrePipe implements PipeTransform {
  transform(value: string | null): string {
    const dictionary: Record<string, string> = {
      GESTOR_SISTEMA: 'Gestor del Sistema',
      ADMINISTRADOR_AREA: 'Administrador de Area',
      FUNCIONARIO: 'Funcionario',
      OPERADOR: 'Funcionario',
    };
    return value ? (dictionary[value] ?? value) : '-';
  }
}
