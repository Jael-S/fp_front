export interface PageResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  size: number;
}
