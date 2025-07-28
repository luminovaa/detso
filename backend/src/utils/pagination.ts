interface PaginationParams {
  page: number
  limit: number
  totalItems: number
}

export function getPagination({ page, limit, totalItems }: PaginationParams) {
  const totalPages = Math.ceil(totalItems / limit)
  const hasNextPage = page < totalPages
  const hasPreviousPage = page > 1
  const skip = (page - 1) * limit

  return {
    skip,
    pagination: {
      currentPage: page,
      limit,
      totalItems,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    }
  }
}
