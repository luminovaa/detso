// components/admin/ticket/TicketFilters.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketFiltersProps {
  selectedStatus: string | undefined;
  selectedPriority: string | undefined;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onCreateTicket: () => void;
  disabled?: boolean;
}

export function TicketFilters({
  selectedStatus = "all",
  selectedPriority = "all",
  onStatusChange,
  onPriorityChange,
  onCreateTicket,
  disabled = false,
}: TicketFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-3">
      <div className="flex flex-wrap gap-3">
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px]" disabled={disabled}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="OPEN">Baru</SelectItem>
            <SelectItem value="IN_PROGRESS">Dalam Proses</SelectItem>
            <SelectItem value="RESOLVED">Selesai</SelectItem>
            <SelectItem value="CLOSED">Ditutup</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPriority} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-[160px]" disabled={disabled}>
            <SelectValue placeholder="Prioritas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Prioritas</SelectItem>
            <SelectItem value="HIGH">Tinggi</SelectItem>
            <SelectItem value="MEDIUM">Sedang</SelectItem>
            <SelectItem value="LOW">Rendah</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        className="rounded-3xl"
        onClick={onCreateTicket}
        disabled={disabled}
      >
        Buat Tiket Baru
      </Button>
    </div>
  );
}