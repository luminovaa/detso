// components/ui/pagination.tsx
"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight
} from "lucide-react";

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  limit: number;           // Ganti dari pageSize → limit
  totalItems: number;
  hasNext: boolean;        // Ganti dari hasNextPage → hasNext
  hasPrev: boolean;        // Ganti dari hasPreviousPage → hasPrev
}

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  showDataCount?: boolean;
  dataCountText?: {
    showing: string;
    of: string;
    data: string;
  };
}

interface PaginationButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default";
  children: React.ReactNode;
}

const PaginationButton: React.FC<PaginationButtonProps> = ({ 
  onClick, 
  disabled, 
  variant = "outline",
  size = "sm",
  children 
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    variant={variant}
    size={size}
    className="h-9 w-9 p-0"
  >
    {children}
  </Button>
);

export function Pagination({
  pagination,
  onPageChange,
  showDataCount = true,
  dataCountText = {
    showing: "Menampilkan",
    of: "dari",
    data: "data"
  }
}: PaginationProps) {
  const paginationRange = useMemo(() => {
    const { totalPages, currentPage } = pagination;
    const delta = 2;

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);
    const pages: (number | string)[] = [];

    if (left > 1) {
      pages.push(1);
      if (left > 2) {
        pages.push('...');
      }
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages) {
      if (right < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  }, [pagination]);

  if (pagination.totalPages <= 1) {
    return null;
  }

  const endItem = Math.min(pagination.currentPage * pagination.limit, pagination.totalItems);

  return (
    <div className="flex items-center justify-between">
      {showDataCount && (
        <div className="text-sm text-gray-700">
          {dataCountText.showing} {endItem} {dataCountText.of} {pagination.totalItems} {dataCountText.data}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <PaginationButton
          onClick={() => onPageChange(1)}
          disabled={!pagination.hasPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </PaginationButton>

        <PaginationButton
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </PaginationButton>

        <div className="flex items-center space-x-1">
          {paginationRange.map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <Button
                  onClick={() => onPageChange(page as number)}
                  variant={page === pagination.currentPage ? "default" : "outline"}
                  size="sm"
                  className="h-9 w-9 p-0"
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        <PaginationButton
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNext}
        >
          <ChevronRight className="h-4 w-4" />
        </PaginationButton>

        <PaginationButton
          onClick={() => onPageChange(pagination.totalPages)}
          disabled={!pagination.hasNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </PaginationButton>
      </div>
    </div>
  );
}