export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface Option<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';
