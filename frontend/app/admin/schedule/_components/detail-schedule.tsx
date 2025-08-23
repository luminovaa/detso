// components/_components/schedule-detail-dialog.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getScheduleById } from "@/api/schedule";
import { formatIndonesiaTime,formatDate } from "@/utils/date-format";
import { Loader2, User, Calendar, Clock, FileText, AlertCircle } from "lucide-react";

interface ScheduleDetailDialogProps {
  scheduleId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ScheduleDetail {
  id: string;
  title: string;
  start: string;
  end: string | null;
  status: string;
  notes: string | null;
  technician: {
    id: string;
    username: string;
    full_name: string;
  };
  ticket: {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    customer: {
      id: string;
      name: string;
      phone: string;
      address: string;
    };
  } | null;
  allDay: boolean;
  created_at: string;
  updated_at: string | null;
}

const ScheduleDetailDialog: React.FC<ScheduleDetailDialogProps> = ({
  scheduleId,
  isOpen,
  onClose,
}) => {
  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && scheduleId) {
      fetchScheduleDetail();
    }
  }, [isOpen, scheduleId]);

  const fetchScheduleDetail = async () => {
    if (!scheduleId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getScheduleById(scheduleId);
      setSchedule(response.data.data);
    } catch (err) {
      setError("Gagal memuat detail jadwal");
      console.error("Error fetching schedule detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "pending":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: "Menunggu",
      in_progress: "Sedang Berlangsung",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      high: "Tinggi",
      medium: "Sedang",
      low: "Rendah",
    };
    return priorityMap[priority.toLowerCase()] || priority;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Detail Jadwal Kerja
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Memuat detail jadwal...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 text-destructive bg-destructive/10 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {schedule && !loading && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 capitalize">{schedule.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getStatusBadgeVariant(schedule.status)}>
                    {getStatusLabel(schedule.status)}
                  </Badge>
                  {schedule.allDay && (
                    <Badge variant="outline">Sepanjang Hari</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    Waktu Mulai
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {formatIndonesiaTime(schedule.start)}
                  </p>
                </div>

                {schedule.end && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Waktu Selesai
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {formatIndonesiaTime(schedule.end)}
                    </p>
                  </div>
                )}
              </div>

              {/* Technician */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4" />
                  Teknisi
                </div>
                <div className="ml-6 p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{schedule.technician.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    @{schedule.technician.username}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {schedule.notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="w-4 h-4" />
                    Catatan
                  </div>
                  <p className="text-sm text-muted-foreground ml-6 p-3 bg-muted/50 rounded-lg">
                    {schedule.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Ticket Information */}
            {schedule.ticket && (
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold mb-4">Informasi Tiket</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{schedule.ticket.title}</h5>
                      <div className="flex gap-2">
                        <Badge variant={getPriorityBadgeVariant(schedule.ticket.priority)}>
                          Prioritas {getPriorityLabel(schedule.ticket.priority)}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(schedule.ticket.status)}>
                          {getStatusLabel(schedule.ticket.status)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {schedule.ticket.description}
                    </p>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-2">
                    <h6 className="font-medium">Informasi Pelanggan</h6>
                    <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                      <p className="font-medium">{schedule.ticket.customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        📞 {schedule.ticket.customer.phone}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        📍 {schedule.ticket.customer.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t pt-4 space-y-2 text-xs text-muted-foreground">
              <p>Dibuat: {formatDate(schedule.created_at)}</p>
              {schedule.updated_at && (
                <p>Diperbarui: {formatIndonesiaTime(schedule.updated_at)}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Tutup
              </Button>
              {/* Add more action buttons here if needed */}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDetailDialog;