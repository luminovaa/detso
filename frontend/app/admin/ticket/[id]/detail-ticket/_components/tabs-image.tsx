"use client"
import React from "react";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "@/types/ticket.types";
import { formatDate } from "@/utils/date-format";

interface ImagesTabProps {
  historyTicket: Ticket[];
  onImageClick: (imageUrl: string) => void;
}

export default function ImagesTab({ historyTicket, onImageClick }: ImagesTabProps) {
  const hasImages = historyTicket.some((h: any) => h.image);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Gambar Pendukung
        </CardTitle>
        <CardDescription>
          Dokumentasi dari riwayat penanganan tiket
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasImages ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {historyTicket
              .filter((h: any) => h.image)
              .map((history: any) => (
                <div
                  key={history.id}
                  className="relative group cursor-pointer overflow-hidden rounded-lg border"
                  onClick={() => onImageClick(history.image)}
                >
                  <Image
                    src={history.image}
                    alt={`History ${history.id}`}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-end p-3">
                    <div className="text-white text-xs opacity-0 group-hover:opacity-100 space-y-1">
                      <p>{formatDate(history.created_at)}</p>
                      <p className="text-xs">
                        oleh{" "}
                        {history.created_by?.full_name ||
                          history.created_by?.username}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Tidak ada gambar pendukung
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}