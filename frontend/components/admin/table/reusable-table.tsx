"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TableSkeleton } from "./skeleton-table";

export interface ColumnDef<T> {
  accessorKey?: keyof T;
  header: string;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

export interface ActionConfig<T> {
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptySearchMessage?: string;
  hasSearch?: boolean;
  showIndex?: boolean;
  indexStartFrom?: number;
  actions?: ActionConfig<T>;
  onRowClick?: (item: T) => void; // Tambahan prop untuk row click
  clickableRow?: boolean; // Tambahan prop untuk mengaktifkan/menonaktifkan clickable row
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = "Tidak ada data",
  emptySearchMessage = "Tidak ada data yang ditemukan",
  hasSearch = false,
  showIndex = false,
  indexStartFrom = 1,
  actions,
  onRowClick,
  clickableRow = false, // Default false agar tidak mengubah behavior existing
}: DataTableProps<T>) {
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (loading && data.length === 0) {
    return (
      <TableSkeleton 
        columns={showIndex ? columns.length + 1 : columns.length} 
        rows={10}
      />
    );
  }

  // Calculate total columns including index and actions
  const totalColumns = columns.length + (showIndex ? 1 : 0) + (actions ? 1 : 0);

  const handleRowClick = (item: T) => {
    if (clickableRow && onRowClick) {
      onRowClick(item);
    }
  };

  return (
    <>
      {/* Tabel */}
      <Card className="overflow-hidden border rounded-xl">
        <div className="relative">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-800">
                {showIndex && (
                  <TableHead className="w-16 text-center">No</TableHead>
                )}
                {columns.map((column, index) => (
                  <TableHead key={index} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
                {actions && (
                  <TableHead className="w-24 text-center">Aksi</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <TableRow 
                    key={index} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 group transition-colors duration-200 ${
                      clickableRow ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => handleRowClick(item)}
                  >
                    {showIndex && (
                      <TableCell className="text-center font-medium text-gray-500 dark:text-gray-400">
                        {indexStartFrom + index}
                      </TableCell>
                    )}
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex} className={column.className}>
                        {column.cell 
                          ? column.cell(item)
                          : column.accessorKey 
                            ? String(item[column.accessorKey] || '-')
                            : '-'
                        }
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell className="text-center">
                        <div 
                          className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onClick={(e) => e.stopPropagation()} // Mencegah event bubbling ke row
                        >
                          {actions.onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                actions.onEdit!(item);
                              }}
                              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                              aria-label="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {actions.onDelete && (
                            <Dialog 
                              open={isDeleteDialogOpen} 
                              onOpenChange={setIsDeleteDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setItemToDelete(item);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Konfirmasi Hapus</DialogTitle>
                                  <DialogDescription>
                                    Apakah Anda yakin ingin menghapus data <strong>{String(item[Object.keys(item)[1]])}</strong>? 
                                    Tindakan ini tidak dapat dibatalkan.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                  >
                                    Batal
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      if (itemToDelete && actions.onDelete) {
                                        actions.onDelete(itemToDelete);
                                      }
                                      setIsDeleteDialogOpen(false);
                                      setItemToDelete(null);
                                    }}
                                  >
                                    Hapus
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={totalColumns} 
                    className="text-center py-8 text-gray-500"
                  >
                    {hasSearch ? emptySearchMessage : emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}