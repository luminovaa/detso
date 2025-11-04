import React from "react";
import { Calendar, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ticket } from "@/types/ticket.types";
import { formatDate } from "@/utils/date-format";

interface HistoryTabProps {
  historyTicket: Ticket[];
  activities: Ticket[];
}

export default function HistoryTab({ historyTicket, activities }: HistoryTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Perubahan Tiket</CardTitle>
          <CardDescription>
            Log aktivitas dan perubahan status tiket
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyTicket && historyTicket.length > 0 ? (
            <div className="space-y-6">
              {historyTicket.map((history: any) => (
                <div
                  key={history.id}
                  className="flex gap-4 pb-4 border-b last:border-0"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={history.created_by?.avatar || ""} />
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium capitalize">
                        {history.created_by?.full_name ||
                          history.created_by?.username ||
                          "Sistem"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(history.created_at)}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">
                        {history.action}
                      </span>
                      : {history.description}
                    </p>
                    {history.image && (
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">
                          Gambar terlampir (lihat di tab Dokumentasi)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Belum ada riwayat
            </p>
          )}
        </CardContent>
      </Card>

      {activities && activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Penjadwalan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((act: any) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <Calendar className="w-4 h-4 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {act.technician?.full_name ||
                        act.technician?.username ||
                        "Teknisi"}
                    </p>
                    <p className="text-muted-foreground">
                      {formatDate(act.start_time)} -{" "}
                      {act.end_time
                        ? formatDate(act.end_time)
                        : "Belum selesai"}
                    </p>
                    {act.notes && (
                      <p className="text-xs italic mt-1">{act.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}