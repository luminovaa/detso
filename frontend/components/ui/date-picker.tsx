// components/ui/date-picker.tsx
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

export function DatePicker({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (date: string | null) => void;
}) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);

    // ✅ KIRIM ke form dalam format ISO: YYYY-MM-DD
    onChange(selectedDate ? format(selectedDate, "yyyy-MM-dd") : null);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal rounded-3xl",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {/* ✅ TAMPILKAN ke user dalam format dd-MM-yyyy */}
          {date ? format(date, "dd-MM-yyyy") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-3xl">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}