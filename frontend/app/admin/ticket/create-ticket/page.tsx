"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { CreateTicketForm, createTicketSchema } from "@/types/ticket.types";
import { FormField } from "@/components/admin/form-field";
import { useToast } from "@/hooks/use-toast";
import {
  FormErrorToast,
  useErrorToast,
} from "@/components/admin/toast-reusable";
import { getCustomers } from "@/api/customer.api";
import { getUsers } from "@/api/user.api";
import { createTicket } from "@/api/ticket";
import { Service_Connection } from "@/types/customer.types";
import CreateTickerSkeleton from "./loading";

interface Technician {
  id: string;
  username: string;
  profile?: {
    full_name: string;
  };
}

function CreateTicket() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [services, setServices] = useState<Service_Connection[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const { success, warning } = useToast();
  const { showApiError, showValidationError } = useErrorToast();
  const [showFormErrors, setShowFormErrors] = useState(false);

  const form = useForm({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      service_id: "",
      title: "",
      description: "",
      priority: "MEDIUM",
      type: "PROBLEM",
      assigned_to: "",
    },
  });
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        const [servicesData, techniciansData] = await Promise.all([
          getCustomers(),
          getUsers({ role: "TENANT_TEKNISI" }),
        ]);

        setServices(servicesData.data.data.services);
        setTechnicians(techniciansData.data.data.users);
      } catch (error: any) {
        showApiError(error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  const onSubmit = async (data: CreateTicketForm) => {
    try {
      setIsLoading(true);

      const submitData = {
        ...data,
        service_id: data.service_id || undefined,
        assigned_to: data.assigned_to || undefined,
      };

      await createTicket(submitData);

      success(`Ticket "${data.title}" berhasil dibuat!`, {
        title: "Berhasil Membuat Ticket",
      });

      setTimeout(() => {
        router.push("/admin/ticket");
      }, 2000);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      warning("Data yang sudah diisi akan hilang jika dibatalkan.", {
        title: "Konfirmasi Pembatalan",
      });
      return;
    }
    router.push("/admin/ticket");
  };

  const handleFormError = () => {
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      showValidationError(errors, "Form Tidak Valid");
      setShowFormErrors(true);
    }
  };

  const serviceOptions = useMemo(
    () =>
      services.map((service) => ({
        value: service.id!,
        label: `${service.id_pel} - ${service.customer?.name} - ${service.package_name}`,
      })),
    [services]
  );

  const technicianOptions = useMemo(
    () =>
      technicians.map((tech) => ({
        value: tech.id,
        label: tech.profile?.full_name || tech.username,
      })),
    [technicians]
  );

  const priorityOptions = [
    { value: "LOW", label: "Rendah" },
    { value: "MEDIUM", label: "Sedang" },
    { value: "HIGH", label: "Tinggi" },
    { value: "CRITICAL", label: "Kritis" },
  ];
  
  const typeOptions = [
    { value: "PROBLEM", label: "Problem" },
    { value: "UPGRADE", label: "Upgrade" },
    { value: "DOWNGRADE", label: "Downgrade" },
  ];

  if (isLoadingData) {
    return (
      <CreateTickerSkeleton/>
    );
  }

  return (
    <AdminPanelLayout title="Tambah Ticket Baru" showSearch={false}>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, handleFormError)}
                className="space-y-6"
              >
                <FormField
                  form={form}
                  name="service_id"
                  label="Layanan (Opsional)"
                  placeholder="Pilih layanan"
                  type="select"
                  selectOptions={serviceOptions}
                  disabled={isLoading}
                />

                <FormField
                  form={form}
                  name="title"
                  label="Judul Ticket *"
                  placeholder="Masukkan judul ticket"
                  disabled={isLoading}
                />

                <FormField
                  form={form}
                  name="description"
                  label="Deskripsi *"
                  placeholder="Masukkan deskripsi masalah"
                  type="textarea"
                  disabled={isLoading}
                />

                <FormField
                  form={form}
                  name="type"
                  label="Tipe *"
                  type="select"
                  selectOptions={typeOptions}
                  disabled={isLoading}
                />

                <FormField
                  form={form}
                  name="priority"
                  label="Prioritas *"
                  type="select"
                  selectOptions={priorityOptions}
                  disabled={isLoading}
                />

                <FormField
                  form={form}
                  name="assigned_to"
                  label="Teknisi (Opsional)"
                  placeholder="Pilih teknisi"
                  type="select"
                  selectOptions={technicianOptions}
                  disabled={isLoading}
                />

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="rounded-3xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-3xl"
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isLoading ? "Menyimpan..." : "Buat Ticket"}
                  </Button>
                </div>
              </form>
            </Form>

            <FormErrorToast
              errors={form.formState.errors}
              isVisible={showFormErrors}
              onDismiss={() => setShowFormErrors(false)}
            />
          </CardContent>
        </Card>
      </div>
    </AdminPanelLayout>
  );
}

export default CreateTicket;
