"use client";
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Wifi,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Ticket } from "@/types/ticket.types";
import Image from "next/image";
import { getTicketById, getTicketHistory } from "@/api/ticket";
import AdminPanelLayout from "@/components/admin/admin-layout";

// Shadcn/ui components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
// import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PriorityBadge,
  TicketStatusBadge,
} from "@/components/admin/badge/ticket-badge";
import { formatDate } from "@/utils/date-format";

export default function TicketDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const ticketId = React.use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyTicket, setHistoryTicket] = useState<Ticket | null>(null);
  const [activities, setActivities] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTicketDetail();
  }, [ticketId.id]);

  const fetchTicketDetail = async () => {
    try {
      setIsLoading(true);
      const response = await getTicketById(ticketId.id);

      if (response.data.success) {
        setTicket(response.data.data.ticket);
      } else {
        setError("Gagal mengambil detail tiket");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat mengambil data tiket");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoryTicket = async () => {
    try {
      setIsLoading(true);
      const response = await getTicketHistory(ticketId.id);

      if (response.data.success) {
        setHistoryTicket(response.data.data.histories);
        setActivities(response.data.data.activities);
      } else {
        setError("Gagal mengambil riwayat tiket");
      }
    } catch (error) {
      setError("Terjadi kesalahan saat mengambil riwayat tiket");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4" />;
      case "RESOLVED":
        return <CheckCircle className="w-4 h-4" />;
      case "CLOSED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <AdminPanelLayout showSearch={false}>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AdminPanelLayout>
    );
  }

  if (error || !ticket) {
    return;
  }

  return (
    <AdminPanelLayout showSearch={false}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 pl-0 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <div className="flex items-center justify-end space-x-2">
            <PriorityBadge priority={ticket.priority} />
            <TicketStatusBadge status={ticket.status} />
            {getStatusIcon(ticket.status!)}
            <span>{ticket.status}</span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96 rounded-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="service">Layanan</TabsTrigger>
            <TabsTrigger value="schedule">Jadwal</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Ticket Information */}
              <Card>
                <CardHeader className="flex justify-between flex-row">
                  <div>
                    <CardTitle>Informasi Tiket</CardTitle>
                    <CardDescription>
                      Detail lengkap mengenai tiket pelanggan
                    </CardDescription>
                  </div>
                  <div className="right-0">
                    <p className="font-mono">
                    {ticket.id?.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Judul
                    </label>
                    <p className="capitalize text-foreground font-medium">
                      {ticket.title}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Deskripsi
                    </label>
                    <p className="capitalize text-foreground leading-relaxed">
                      {ticket.description || "Tidak ada deskripsi"}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground block">
                        Dibuat
                      </label>
                      <p className="text-foreground text-sm">
                        {formatDate(ticket.created_at!)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground block">
                        Diperbarui
                      </label>
                      <p className="text-foreground text-sm">
                        {formatDate(ticket.updated_at!)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground block">
                        Diselesaikan
                      </label>
                      <p className="text-foreground text-sm">
                        {formatDate(ticket.resolved_at!)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="service" className="space-y-6">
            {ticket.service ? (
              <Card>
                <CardHeader className="flex flex-row items-center space-x-2 space-y-0">
                  <Wifi className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle>Informasi Layanan</CardTitle>
                    <CardDescription>
                      Detail layanan internet pelanggan
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground block">
                          ID Pelanggan
                        </label>
                        <p className="text-foreground font-mono font-medium">
                          {ticket.service.id_pel}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground block">
                          Paket
                        </label>
                        <p className="text-foreground">
                          {ticket.service.package_name}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground block">
                          Kecepatan
                        </label>
                        <p className="text-foreground font-medium">
                          {ticket.service.package_speed}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground block">
                          MAC Address
                        </label>
                        <p className="text-foreground font-mono">
                          {ticket.service.mac_address || "-"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground block">
                          Alamat Instalasi
                        </label>
                        <p className="text-foreground leading-relaxed">
                          {ticket.service.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Tidak ada informasi layanan
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            {ticket.schedule ? (
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
                          {formatDate(
                            ticket.schedule.start_time!
                          )}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground block">
                          Selesai
                        </label>
                        <p className="text-foreground text-sm">
                          {formatDate(
                            ticket.schedule.end_time!
                          )}
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
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Tidak ada jadwal terkait
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminPanelLayout>
  );
}
