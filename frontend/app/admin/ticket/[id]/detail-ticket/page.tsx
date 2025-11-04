"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Ticket } from "@/types/ticket.types";
import { getTicketById, getTicketHistory } from "@/api/ticket";
import AdminPanelLayout from "@/components/admin/admin-layout";

// Shadcn/ui components
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  PriorityBadge,
  TicketStatusBadge,
} from "@/components/admin/badge/ticket-badge";

import OverviewTab from "./_components/tabs-overview";
import ServiceTab from "./_components/tabs-service";
import ScheduleTab from "./_components/tabs-schedule";
import HistoryTab from "./_components/tabs-history";
import ImagesTab from "./_components/tabs-image";

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
  const [historyTicket, setHistoryTicket] = useState<Ticket[]>([]);
  const [activities, setActivities] = useState<Ticket[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchTicketDetail();
    fetchHistoryTicket();
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
  };

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
                <CardContent className="p-6 space-y-4">
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
          </div>
        </div>
      </AdminPanelLayout>
    );
  }

  if (error || !ticket) {
    return null;
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
          <TabsList className="grid w-full grid-cols-5 lg:w-[500px] rounded-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="service">Layanan</TabsTrigger>
            <TabsTrigger value="schedule">Jadwal</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
            <TabsTrigger value="images">Dokumentasi</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab ticket={ticket} />
          </TabsContent>

          <TabsContent value="service" className="space-y-6">
            <ServiceTab ticket={ticket} />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <ScheduleTab ticket={ticket} />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <HistoryTab historyTicket={historyTicket} activities={activities} />
          </TabsContent>

          <TabsContent value="images" className="space-y-6">
            <ImagesTab 
              historyTicket={historyTicket} 
              onImageClick={setSelectedImage} 
            />
          </TabsContent>
        </Tabs>

        {/* Modal Zoom Gambar */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl w-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-12 right-0 text-white hover:bg-white/20"
                onClick={() => setSelectedImage(null)}
              >
                <XCircle className="w-6 h-6" />
              </Button>
              <Image
                src={selectedImage}
                alt="Zoom"
                width={1200}
                height={800}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </AdminPanelLayout>
  );
}