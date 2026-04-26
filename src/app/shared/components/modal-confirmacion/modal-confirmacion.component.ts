import { Component, input } from '@angular/core';

@Component({
  selector: 'app-modal-confirmacion',
  standalone: true,
  templateUrl: './modal-confirmacion.component.html',
  styleUrl: './modal-confirmacion.component.scss',
})
export class ModalConfirmacionComponent {
  readonly titulo = input('Confirmar accion');
  readonly mensaje = input('Desea continuar?');
}
