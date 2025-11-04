import React from "react";
import { Calendar, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/admin/badge/ticket-badge";
import { Ticket } from "@/types/ticket.types";
import { formatDate } from "@/utils/date-format";

interface ScheduleTabProps {
  ticket: Ticket;
}

export default function ScheduleTab({ ticket }: ScheduleTabProps) {
  if (!ticket.schedule) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Tidak ada jadwal terkait
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-x-2 space-y-0">
        <Calendar className="w-5 h-5 text-primary" />
        <div>
          <CardTitle>Informasi Jadwal</CardTitle>
          <CardDescription>
            Detail jadwal penanganan tiket
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Status
              </span>
              <PriorityBadge priority={ticket.schedule.status} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">
                Mulai
              </label>
              <p className="text-foreground text-sm">
                {formatDate(ticket.schedule.start_time!)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">
                Selesai
              </label>
              <p className="text-foreground text-sm">
                {formatDate(ticket.schedule.end_time!)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {ticket.schedule.notes && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground block">
                  Catatan
                </label>
                <p className="text-foreground text-sm leading-relaxed">
                  {ticket.schedule.notes}
                </p>
              </div>
            )}

            {ticket.schedule.technician && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground block">
                  Teknisi Terjadwal
                </label>
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={ticket.schedule.technician.avatar || ""}
                    />
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {ticket.schedule.technician.full_name ||
                        ticket.schedule.technician.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{ticket.schedule.technician.username}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}