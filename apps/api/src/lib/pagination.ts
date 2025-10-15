/**
 * Pagination Utilities
 *
 * Provides helpers for paginated responses with cursor and offset-based pagination.
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CursorPaginationMeta {
  cursor?: string;
  nextCursor?: string | null;
  hasNextPage: boolean;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: CursorPaginationMeta;
}

/**
 * Parse and validate pagination parameters
 */
export function parsePaginationParams(params: {
  page?: string | number;
  limit?: string | number;
}): PaginationParams {
  const page =
    typeof params.page === "string" ? parseInt(params.page, 10) : params.page;
  const limit =
    typeof params.limit === "string"
      ? parseInt(params.limit, 10)
      : params.limit;

  return {
    page: page && page > 0 ? page : 1,
    limit: limit && limit > 0 && limit <= 100 ? limit : 20,
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Get skip and take values for Prisma queries
 */
export function getPaginationArgs(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: calculatePagination(total, page, limit),
  };
}

/**
 * Create a cursor-based paginated response
 */
export function createCursorPaginatedResponse<T extends { id: string }>(
  data: T[],
  limit: number,
  cursor?: string
): CursorPaginatedResponse<T> {
  const hasNextPage = data.length > limit;
  const items = hasNextPage ? data.slice(0, limit) : data;
  const nextCursor = hasNextPage ? items[items.length - 1]?.id : null;

  return {
    data: items,
    pagination: {
      cursor,
      nextCursor,
      hasNextPage,
      limit,
    },
  };
}
