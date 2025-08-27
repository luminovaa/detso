"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  CreateTicketForm,
  createTicketSchema,
} from "@/types/ticket.types";
import { FormField } from "@/components/admin/form-field";
import { useToast } from "@/hooks/use-toast";
import {
  FormErrorToast,
  useErrorToast,
} from "@/components/admin/toast-reusable";
import { getCustomers } from "@/api/customer.api";

interface Customer {
  id: string;
  name: string;
  phone?: string;
}

interface Service {
  id: string;
  id_pel: string;
  package_name: string;
  customer_id: string;
}

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  
  const { success, warning } = useToast();
  const { showApiError, showValidationError } = useErrorToast();
  const [showFormErrors, setShowFormErrors] = useState(false);

  const form = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      customer_id: "",
      service_id: "",
      title: "",
      description: "",
      priority: "MEDIUM",
      assigned_to: "",
    },
  });

  const watchCustomerId = form.watch("customer_id");

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        const [customersData, servicesData, techniciansData] = await Promise.all([
          getCustomers(),
          getServices(), 
          getTechnicians(),
        ]);
        
        setCustomers(customersData);
        setServices(servicesData);
        setTechnicians(techniciansData);
      } catch (error: any) {
        showApiError(error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [showApiError]);

  // Filter services based on selected customer
  useEffect(() => {
    if (watchCustomerId) {
      const customerServices = services.filter(
        (service) => service.customer_id === watchCustomerId
      );
      setFilteredServices(customerServices);
      
      const currentServiceId = form.getValues("service_id");
      if (currentServiceId && !customerServices.find(s => s.id === currentServiceId)) {
        form.setValue("service_id", "");
      }
    } else {
      setFilteredServices([]);
      form.setValue("service_id", "");
    }
  }, [watchCustomerId, services, form]);

  const onSubmit = async (data: CreateTicketFormData) => {
    try {
      setIsLoading(true);

      // Remove empty service_id and assigned_to if not selected
      const submitData = {
        ...data,
        service_id: data.service_id || undefined,
        assigned_to: data.assigned_to || undefined,
      };

      const result = await createTicket(submitData);

      success(`Ticket "${data.title}" berhasil dibuat!`, {
        title: "Berhasil Membuat Ticket",
      });

      setTimeout(() => {
        router.push("/admin/tickets");
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
    router.push("/admin/tickets");
  };

  const handleFormError = () => {
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      showValidationError(errors, "Form Tidak Valid");
      setShowFormErrors(true);
    }
  };

  if (isLoadingData) {
    return (
      <AdminPanelLayout title="Tambah Ticket Baru" showSearch={false}>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center py-10">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat data...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminPanelLayout>
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
                {/* Customer Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.watch("customer_id")}
                    onValueChange={(value) => form.setValue("customer_id", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} {customer.phone && `(${customer.phone})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.customer_id && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.customer_id.message}
                    </p>
                  )}
                </div>

                {/* Service Selection (Optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Layanan (Opsional)
                  </label>
                  <Select
                    value={form.watch("service_id")}
                    onValueChange={(value) => form.setValue("service_id", value)}
                    disabled={isLoading || !watchCustomerId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !watchCustomerId 
                          ? "Pilih customer terlebih dahulu" 
                          : filteredServices.length === 0
                          ? "Tidak ada layanan tersedia"
                          : "Pilih layanan (opsional)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.id_pel} - {service.package_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <FormField
                  form={form}
                  name="title"
                  label="Judul Ticket *"
                  placeholder="Masukkan judul ticket"
                  disabled={isLoading}
                />

                {/* Description */}
                <FormField
                  form={form}
                  name="description"
                  label="Deskripsi *"
                  placeholder="Masukkan deskripsi masalah"
                  disabled={isLoading}
                  type="textarea"
                />

                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Prioritas <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.watch("priority")}
                    onValueChange={(value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => 
                      form.setValue("priority", value)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Rendah</SelectItem>
                      <SelectItem value="MEDIUM">Sedang</SelectItem>
                      <SelectItem value="HIGH">Tinggi</SelectItem>
                      <SelectItem value="CRITICAL">Kritis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assigned To (Optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Teknisi (Opsional)
                  </label>
                  <Select
                    value={form.watch("assigned_to")}
                    onValueChange={(value) => form.setValue("assigned_to", value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih teknisi (opsional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((technician) => (
                        <SelectItem key={technician.id} value={technician.id}>
                          {technician.profile?.full_name || technician.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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