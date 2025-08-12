// components/ui/table-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  showHeader?: boolean;
}

export function TableSkeleton({ 
  columns, 
  rows = 5, 
  showHeader = true 
}: TableSkeletonProps) {
  return (
    <Card className="overflow-hidden border rounded-xl">
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow className="bg-gray-100">
              {Array.from({ length: columns }).map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton 
                    className={`h-4 ${
                      colIndex === 0 
                        ? 'w-8' // Narrower for index column
                        : colIndex === columns - 1 
                          ? 'w-32' // Wider for last column (usually email)
                          : 'w-24' // Medium width for other columns
                    }`} 
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// Alternative: Simple skeleton rows without table structure
export function TableRowSkeleton({ columns }: { columns: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className={`h-4 ${
                colIndex === 0 
                  ? 'w-8' 
                  : colIndex === columns - 1 
                    ? 'w-32' 
                    : 'w-24'
              }`} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}