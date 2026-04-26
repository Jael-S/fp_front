export interface Notificacion {
  id: string;
  tramiteId: string | null;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaLectura?: string | null;
  creadoEn: string;
}
