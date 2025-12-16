"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TenantFiltersProps {
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  onCreateTenant: () => void;
}

export function TenantFilters({
  selectedStatus,
  onStatusChange,
  onCreateTenant,
}: TenantFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Filter Status */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* <span className="text-sm font-medium whitespace-nowrap">Status:</span> */}
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[140px] rounded-full">
            <SelectValue placeholder="Pilih status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="true">Aktif</SelectItem>
            <SelectItem value="false">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}