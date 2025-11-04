"use client";

import React from "react";
import { Wifi } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "@/types/ticket.types";

interface ServiceTabProps {
  ticket: Ticket;
}

export default function ServiceTab({ ticket }: ServiceTabProps) {
  if (!ticket.service) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Tidak ada informasi layanan
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
  );
}