export enum Rol {
  GESTOR_SISTEMA = 'GESTOR_SISTEMA',
  ADMINISTRADOR_AREA = 'ADMINISTRADOR_AREA',
  FUNCIONARIO = 'FUNCIONARIO',
  OPERADOR = 'OPERADOR',
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  token: string;
  empresaId: string | null;
  departamentoId: string | null;
}

