"use client"
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Ticket } from "@/types/ticket.types";
import { formatDate } from "@/utils/date-format";

interface OverviewTabProps {
  ticket: Ticket;
}

export default function OverviewTab({ ticket }: OverviewTabProps) {
  return (
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
  );
}