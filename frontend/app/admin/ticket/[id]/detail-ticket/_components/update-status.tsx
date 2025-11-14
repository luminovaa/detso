"use client";

import React, { useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { updateTicketStatus } from "@/api/ticket";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { FileDropzone } from "@/components/admin/dropzone-reusable";
import { useErrorToast } from "@/components/admin/toast-reusable";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

interface UpdateStatusTicketProps {
  ticketId: string;
  currentStatus: TicketStatus;
  onStatusUpdated?: () => void;
}

export default function UpdateStatusTicket({
  ticketId,
  currentStatus,
  onStatusUpdated,
}: UpdateStatusTicketProps) {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { success, warning } = useToast();
  const { showApiError } = useErrorToast();
  const router = useRouter();

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const statusOptions = [
    { value: "OPEN", label: "Open" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
  ];

  const requiresImage =
    selectedStatus === "RESOLVED" || selectedStatus === "CLOSED";

  const handleFileUpload = (file: File) => {
    setImageFile(file);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStatus) {
      warning("Silakan pilih status terlebih dahulu");
      return;
    }

    if (requiresImage && !imageFile) {
      warning("Foto dokumentasi wajib diupload untuk status Resolved/Closed");
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("status", selectedStatus);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await updateTicketStatus(ticketId, formData);

      if (response.data.success) {
        success(`Status tiket berhasil diubah menjadi ${selectedStatus}`);

        setOpen(false);
        setSelectedStatus("");
        setImageFile(null);

        if (onStatusUpdated) {
          onStatusUpdated();
        } else {
          router.refresh();
        }
      }
    } catch (error: any) {
      showApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          Update Status
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Status Tiket</DialogTitle>
          <DialogDescription>
            Ubah status tiket. Foto dokumentasi wajib untuk status
            Resolved/Closed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status Baru</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                setSelectedStatus(value as TicketStatus)
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Pilih status baru" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.value === currentStatus}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiresImage && (
            <div className="space-y-2">
              <Label>Dokumentasi (Wajib)</Label>

              {/* Desktop/Laptop: Dropzone */}
              {!isMobile && (
                <FileDropzone
                  onFileUpload={handleFileUpload}
                  accept={{ "image/*": [".jpg", ".jpeg", ".png"] }}
                  placeholder="Tarik & lepas foto di sini, atau klik untuk memilih"
                  fileType="image"
                  maxSizeMB={5}
                  showPreview={true}
                />
              )}

              {/* Mobile/Tablet: Camera & Gallery Options */}
              {isMobile && (
                <div className="space-y-3">
                  {imageFile ? (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Upload className="h-8 w-8 text-green-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {imageFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setImageFile(null)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleCameraCapture}
                          />
                          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                            <Camera className="h-8 w-8 mb-2 text-blue-500" />
                            <span className="text-sm font-medium">Kamera</span>
                          </div>
                        </label>

                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleGallerySelect}
                          />
                          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg hover:border-green-500 transition-colors">
                            <Upload className="h-8 w-8 mb-2 text-green-500" />
                            <span className="text-sm font-medium">Galeri</span>
                          </div>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        JPG, PNG (Max 5MB)
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              setSelectedStatus("");
              setImageFile(null);
            }}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !selectedStatus}
          >
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
