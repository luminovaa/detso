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
  showCreateButton?: boolean; 
}

export function TicketFilters({
  selectedStatus = "all",
  selectedPriority = "all",
  onStatusChange,
  onPriorityChange,
  onCreateTicket,
  disabled = false,
  showCreateButton = true,
}: TicketFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-3">
      <div className="flex flex-wrap gap-3">
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px] rounded-3xl" disabled={disabled}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-3xl">
            <SelectItem className="rounded-3xl" value="all">Semua Status</SelectItem>
            <SelectItem className="rounded-3xl" value="OPEN">Baru</SelectItem>
            <SelectItem className="rounded-3xl" value="IN_PROGRESS">Dalam Proses</SelectItem>
            <SelectItem className="rounded-3xl" value="RESOLVED">Selesai</SelectItem>
            <SelectItem className="rounded-3xl" value="CLOSED">Ditutup</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPriority} onValueChange={onPriorityChange}>
          <SelectTrigger className="w-[160px] rounded-3xl" disabled={disabled}>
            <SelectValue placeholder="Prioritas" />
          </SelectTrigger>
          <SelectContent className="rounded-3xl">
            <SelectItem className="rounded-3xl" value="all">Semua Prioritas</SelectItem>
            <SelectItem className="rounded-3xl" value="HIGH">Tinggi</SelectItem>
            <SelectItem className="rounded-3xl" value="MEDIUM">Sedang</SelectItem>
            <SelectItem className="rounded-3xl" value="LOW">Rendah</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showCreateButton && (
        <Button
          className="rounded-3xl"
          onClick={onCreateTicket}
          disabled={disabled}
        >
          Buat Tiket Baru
        </Button>
      )}
    </div>
  );
}