export interface ApiResponse<T> {
  data: T;
  error: string | null;
  message: string | null;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}
