"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import io from "socket.io-client";
import QRCode from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  CheckCircle2,
  Loader2,
  Smartphone,
  RefreshCw,
  Wifi,
  WifiOff,
  MessageCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { getLogs } from "@/api/whatsapp.api";
import { Whatsapp_logs } from "@/types/whatsapp.types";
import {
  Pagination,
  PaginationMeta,
} from "@/components/admin/table/reusable-pagination";
import { ColumnDef, DataTable } from "@/components/admin/table/reusable-table";
import { SendMessageDialog } from "./_components/send-message";

interface WhatsappResponse {
  logs: Whatsapp_logs[];
  pagination: PaginationMeta;
}

const WhatsAppAuthPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  // WhatsApp Auth States
  const [qrCode, setQrCode] = useState<string>("");
  const [status, setStatus] = useState<"connecting" | "waiting" | "ready">(
    "connecting"
  );
  const [isConnected, setIsConnected] = useState(false);

  // WhatsApp Logs States
  const [whatsapps, setWhatsapp] = useState<Whatsapp_logs[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Socket.IO connection for WhatsApp auth
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL);

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      setIsConnected(true);
      socket.emit("get-whatsapp-status");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("whatsapp-status", (data: { isReady: boolean }) => {
      if (data.isReady) {
        setStatus("ready");
        setQrCode("");
      } else {
        setStatus("waiting");
      }
    });

     socket.on("whatsapp-disconnected", () => {
      setStatus("connecting");
      setQrCode("");
    });

    socket.on("whatsapp-authenticated", () => {
      setStatus("ready");
      setQrCode("");
    });

    socket.on("whatsapp-qr", (qr: string) => {
      setQrCode(qr);
      setStatus("waiting");
    });

    socket.on("whatsapp-ready", () => {
      setStatus("ready");
      setQrCode("");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchWhatsapp = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
      };

      const response = await getLogs(params);
      const data: WhatsappResponse = response.data.data;

      setWhatsapp(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching whatsapps:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "ready") {
      fetchWhatsapp();
    }
  }, [status, currentPage, limit]);

  const columns: ColumnDef<Whatsapp_logs>[] = [
    {
      header: "Nama Client",
      cell: (whatsapps) => whatsapps.customer?.name || "Tidak ada nama",
    },
    {
      header: "Nomer WhatsApp",
      accessorKey: "phone_number",
    },
    {
      header: "Tipe Pesan",
      accessorKey: "message_type",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (whatsapps) => (
        <Badge
          variant={whatsapps.status === "sent" ? "default" : "destructive"}
        >
          {whatsapps.status}
        </Badge>
      ),
    },
    {
      header: "Tanggal",
      accessorKey: "sent_at",
      cell: (whatsapps) =>
        new Date(whatsapps.sent_at!).toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
        }),
    },
    {
      header: "Keterangan",
      accessorKey: "error_message",
      cell: (whatsapps) => whatsapps.error_message || "-",
    },
  ];

  const updateSearchParams = (newParams: Record<string, string | number>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        current.set(key, value.toString());
      } else {
        current.delete(key);
      }
    });

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${window.location.pathname}${query}`);
  };

  const handlePageChange = (page: number) => {
    updateSearchParams({ page, limit });
  };

  const refreshConnection = () => {
    window.location.reload();
  };

  const getStatusInfo = () => {
    switch (status) {
      case "connecting":
        return {
          title: "Menghubungkan ke Server",
          description: "Sedang membangun koneksi...",
          icon: <Loader2 className="w-8 h-8 animate-spin text-primary" />,
          badge: { text: "Connecting", variant: "secondary" as const },
        };
      case "waiting":
        return {
          title: "Scan QR Code",
          description:
            "Gunakan WhatsApp di perangkat Anda untuk memindai QR Code",
          icon: <QrCode className="w-8 h-8 text-yellow-500" />,
          badge: { text: "Menunggu Scan", variant: "default" as const },
        };
      case "ready":
        return {
          title: "WhatsApp Terhubung!",
          description: "Selamat! WhatsApp berhasil terhubung ke sistem",
          icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
          badge: { text: "Terhubung", variant: "default" as const },
        };
    }
  };

  const statusInfo = getStatusInfo();

  const WhatsAppStatus = () => (
    <Card className="mb-6 border-l-4 border-l-green-500 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-green-700">Status WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                {status === "ready"
                  ? "WhatsApp terhubung dan siap digunakan"
                  : "WhatsApp belum terhubung"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={status === "ready" ? "default" : "secondary"}
              className={
                status === "ready"
                  ? "bg-green-100 text-green-700 border-green-300"
                  : ""
              }
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  status === "ready" ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              {statusInfo.badge.text}
            </Badge>
            {status === "ready" && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Clock className="w-3 h-3" />
                Aktif
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminPanelLayout
      showSearch={false}
      title={status === "ready" ? "WhatsApp Logs" : "WhatsApp Auth"}
    >
      {status === "ready" ? (
        <div className="space-y-4">
          <WhatsAppStatus />
          <div className="flex justify-end gap-3">
            <SendMessageDialog onSuccess={fetchWhatsapp} />
          </div>

          <DataTable
            columns={columns}
            data={whatsapps}
            loading={loading}
            emptyMessage="Tidak ada data log WhatsApp"
            emptySearchMessage="Tidak ada data yang ditemukan"
            showIndex={true}
            indexStartFrom={(currentPage - 1) * limit + 1}
          />

          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              showDataCount={true}
              dataCountText={{
                showing: "Menampilkan",
                of: "dari",
                data: "data",
              }}
            />
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="flex items-center justify-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-primary" />
              ) : (
                <WifiOff className="w-4 h-4 text-destructive" />
              )}
              <span className="text-sm text-muted-foreground">
                {isConnected
                  ? "Terhubung ke server"
                  : "Tidak terhubung ke server"}
              </span>
            </div>

            <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                  {statusInfo.icon}
                  <Badge variant={statusInfo.badge.variant}>
                    {statusInfo.badge.text}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{statusInfo.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <p className="text-center text-muted-foreground text-sm">
                  {statusInfo.description}
                </p>

                {qrCode && status === "waiting" && (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-yellow-200">
                      <QRCode
                        value={qrCode}
                        size={200}
                        level="H"
                      />
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-start gap-3">
                        <Smartphone className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="font-medium text-yellow-700 text-sm">
                            Cara memindai QR Code:
                          </p>
                          <ol className="text-yellow-600 text-xs space-y-1">
                            <li>1. Buka WhatsApp di ponsel Anda</li>
                            <li>2. Ketuk Menu (⋮) → Perangkat Tertaut</li>
                            <li>3. Ketuk &quot;Tautkan Perangkat Baru&quot;</li>
                            <li>4. Arahkan kamera ke QR Code ini</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {status === "connecting" && (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-blue-700 font-medium">
                        Membangun koneksi...
                      </p>
                      <p className="text-blue-600 text-sm mt-1">
                        Mohon tunggu sebentar
                      </p>
                    </div>
                  </div>
                )}

                {!isConnected && (
                  <Button
                    onClick={refreshConnection}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Coba Lagi
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p>QR Code akan kedaluwarsa dalam beberapa menit</p>
              <p>Pastikan perangkat Anda terhubung ke internet</p>
            </div>
          </div>
        </div>
      )}
    </AdminPanelLayout>
  );
};

export default WhatsAppAuthPage;
