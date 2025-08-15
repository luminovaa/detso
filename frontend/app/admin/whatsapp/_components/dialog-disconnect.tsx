// src/components/admin/whatsapp/disconnect-dialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { logoutWhatsapp } from "@/api/whatsapp.api";
import { useToast } from "@/hooks/use-toast";

interface DisconnectDialogProps {
  children: React.ReactNode;
  onDisconnectSuccess?: () => void;
}

export function DisconnectDialog({
  children,
  onDisconnectSuccess,
}: DisconnectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await logoutWhatsapp();
      toast({
        title: "Berhasil",
        description: "WhatsApp telah terputus dari sistem.",
      });
      onDisconnectSuccess?.();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Gagal",
        description: "Tidak bisa memutuskan koneksi WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Konfirmasi Pemutusan
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin memutuskan koneksi WhatsApp? Anda harus
            memindai ulang QR Code untuk menghubungkan kembali.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 p-3 mt-2 text-sm text-yellow-700 bg-yellow-50 rounded-md border border-yellow-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Tindakan ini tidak dapat dibatalkan. WhatsApp akan logout dari
            perangkat ini.
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <LogOut className="w-4 h-4 animate-spin" />
                Memutuskan...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                Ya, Putuskan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}