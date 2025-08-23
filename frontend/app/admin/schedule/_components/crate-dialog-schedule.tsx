"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Plus, Loader2 } from "lucide-react";
import { User } from "@/types/user.types";
import { useToast } from "@/hooks/use-toast";
import {
  CreateWorkSchedule,
  createWorkScheduleSchema,
} from "@/types/schedule.types";
import { getUsers } from "@/api/user.api";
import { createSchedule } from "@/api/schedule";
import { useErrorToast } from "@/components/admin/toast-reusable";
import { FormField } from "@/components/admin/form-field";

interface CreateScheduleDialogProps {
  selectedDate?: string; // ISO date string (YYYY-MM-DD)
  onScheduleCreated?: () => void;
  trigger?: React.ReactNode;
}

export default function CreateScheduleDialog({
  selectedDate,
  onScheduleCreated,
  trigger,
}: CreateScheduleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [technicians, setTechnicians] = useState<User[]>([]);

  const { success, warning } = useToast();
  const { showApiError, showValidationError } = useErrorToast();
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  const form = useForm({
    resolver: zodResolver(createWorkScheduleSchema),
    defaultValues: {
      technician_id: "",
      start_date: selectedDate || "",
      start_time: "",
      end_date: "",
      end_time: "",
      title: "",
      status: "SCHEDULED",
      notes: "",
    },
  });

  // Update start_date when selectedDate prop changes
  useEffect(() => {
    if (selectedDate) {
      form.setValue("start_date", selectedDate);
      form.setValue("end_date", selectedDate);
    }
  }, [selectedDate, form]);

  const fetchTechnicians = async () => {
    try {
      setLoadingTechnicians(true);
      const response = await getUsers({
        limit: 100,
      });

      if (response.data?.data) {
        setTechnicians(response.data.data.users);
      }
    } catch (error) {
      console.error("Error fetching technicians:", error);
      showApiError(error);
    } finally {
      setLoadingTechnicians(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTechnicians();
    }
  }, [isOpen]);

  const onSubmit = async (data: CreateWorkSchedule) => {
    try {
      setIsLoading(true);

      const startDateTime = new Date(`${data.start_date}T${data.start_time}`);
      const utcStartTime = startDateTime.toISOString();

      let utcEndTime: string | null = null;
      if (data.end_date && data.end_time) {
        const endDateTime = new Date(`${data.end_date}T${data.end_time}`);
        utcEndTime = endDateTime.toISOString();
      }

      const scheduleData: CreateWorkSchedule = {
        technician_id: data.technician_id,
        start_time: utcStartTime,
        title: data.title,
        end_time: utcEndTime || "",
        status: data.status,
        notes: data.notes || "",
      };

      await createSchedule(scheduleData);

      success("Jadwal kerja berhasil dibuat");
      setIsOpen(false);
      form.reset();

      if (onScheduleCreated) {
        onScheduleCreated();
      }
    } catch (error: any) {
      console.error("Error creating schedule:", error);
      showApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset({
        technician_id: "",
        start_date: selectedDate || "",
        start_time: "",
        title: "",
        end_date: selectedDate || "",
        end_time: "",
        status: "SCHEDULED",
        notes: "",
      });
    }
  };

  const technicianOptions = technicians.map((technician) => ({
    value: technician.id ?? "",
    label: technician.profile?.full_name || technician.username,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2 rounded-3xl">
            <Plus className="h-4 w-4" />
            Tambah Jadwal
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Buat Jadwal Kerja Baru</DialogTitle>
          <DialogDescription>
            Buat jadwal kerja baru untuk teknisi. Pastikan semua field yang
            diperlukan telah diisi dengan benar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
              <FormField
                form={form}
                name="title"
                label="Judul"
                placeholder="Masukkan judul jadwal kerja"
                description="Judul jadwal kerja"
              />
              <FormField
                form={form}
                name="technician_id"
                label="Teknisi"
                type="select"
                placeholder={
                  loadingTechnicians ? "Memuat teknisi..." : "Pilih teknisi"
                }
                selectOptions={technicianOptions}
                disabled={loadingTechnicians}
                description="Pilih teknisi yang akan ditugaskan"
              />

              {/* Start Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  form={form}
                  name="start_date"
                  label="Tanggal Mulai"
                  type="date"
                  description="Tanggal mulai jadwal"
                />
                <FormField
                  form={form}
                  name="start_time"
                  label="Waktu Mulai"
                  type="time"
                  placeholder="HH:MM"
                  description="Waktu mulai dalam format 24 jam"
                />
              </div>

              {/* End Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  form={form}
                  name="end_date"
                  label="Tanggal Selesai"
                  type="date"
                  description="Tanggal selesai (opsional)"
                />
                <FormField
                  form={form}
                  name="end_time"
                  label="Waktu Selesai"
                  type="time"
                  placeholder="HH:MM"
                  description="Waktu selesai (opsional)"
                />
              </div>
              <FormField
                form={form}
                name="notes"
                label="Catatan"
                type="textarea"
                placeholder="Masukkan catatan tambahan (opsional)"
                description="Catatan atau keterangan tambahan"
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Buat Jadwal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
