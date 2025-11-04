"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Users, AlertCircle, Image as ImageIcon } from "lucide-react";
import { FormField } from "@/components/admin/form-field";
import { useToast } from "@/hooks/use-toast";
import { FormErrorToast, useErrorToast } from "@/components/admin/toast-reusable";
import { getCustomers } from "@/api/customer.api";
import { getUsers } from "@/api/user.api";
import { getTicketById, editTicket } from "@/api/ticket";
import { Service_Connection } from "@/types/customer.types";
import { EditTicketForm, editTicketSchema, Ticket } from "@/types/ticket.types";
import Image from "next/image";

// Schema untuk edit ticket

interface Technician {
  id: string;
  username: string;
  profile?: {
    full_name: string;
  };
}

interface EditTicketPageProps {
  params: Promise<{ id: string }>;
}

function EditTicket({ params }: EditTicketPageProps) {
  const router = useRouter();
  const ticketId = React.use(params);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [services, setServices] = useState<Service_Connection[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { success, warning } = useToast();
  const { showApiError, showValidationError } = useErrorToast();
  const [showFormErrors, setShowFormErrors] = useState(false);

  const form = useForm<EditTicketForm>({
    resolver: zodResolver(editTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      status: "OPEN",
      assigned_to: "",
      service_id: "",
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        const [ticketData, servicesData, techniciansData] = await Promise.all([
          getTicketById(ticketId.id),
          getCustomers(),
          getUsers({ role: "TEKNISI" }),
        ]);

        const fetchedTicket = ticketData.data.data.ticket;
        setTicket(fetchedTicket);
        setServices(servicesData.data.data.services);
        setTechnicians(techniciansData.data.data.users);

        // Set form values
        form.reset({
          title: fetchedTicket.title || "",
          description: fetchedTicket.description || "",
          priority: fetchedTicket.priority || "MEDIUM",
          status: fetchedTicket.status || "OPEN",
          assigned_to: fetchedTicket.assigned_to || "",
          service_id: fetchedTicket.service_id || "",
        });
      } catch (error: any) {
        showApiError(error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [ticketId.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: EditTicketForm) => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      
      // Append only changed fields
      if (data.title !== ticket?.title) formData.append("title", data.title || "");
      if (data.description !== ticket?.description) formData.append("description", data.description || "");
      if (data.priority !== ticket?.priority) formData.append("priority", data.priority || "");
      if (data.status !== ticket?.status) formData.append("status", data.status || "");
      if (data.assigned_to !== ticket?.assigned_to) formData.append("assigned_to", data.assigned_to || "");
      if (data.service_id !== ticket?.service_id) formData.append("service_id", data.service_id || "");
      
      // Add image if provided and status is RESOLVED or CLOSED
      if (imageFile && (data.status === "RESOLVED" || data.status === "CLOSED")) {
        formData.append("image", imageFile);
      }

      await editTicket(ticketId.id, formData);

      success(`Ticket "${data.title}" berhasil diperbarui!`, {
        title: "Berhasil Memperbarui Ticket",
      });

      setTimeout(() => {
        router.push(`/admin/ticket`);
      }, 2000);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      warning("Data yang sudah diubah akan hilang jika dibatalkan.", {
        title: "Konfirmasi Pembatalan",
      });
      return;
    }
    router.push(`/admin/ticket`);
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

  const statusOptions = [
    { value: "OPEN", label: "Terbuka" },
    { value: "IN_PROGRESS", label: "Dalam Progress" },
    { value: "RESOLVED", label: "Terselesaikan" },
    { value: "CLOSED", label: "Ditutup" },
  ];

  const currentStatus = form.watch("status");
  const showImageUpload = currentStatus === "RESOLVED" || currentStatus === "CLOSED";

  if (isLoadingData) {
    return (
      <AdminPanelLayout title="Edit Ticket" showSearch={false}>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminPanelLayout>
    );
  }

  if (!ticket) {
    return (
      <AdminPanelLayout title="Edit Ticket" showSearch={false}>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Ticket tidak ditemukan</p>
            </CardContent>
          </Card>
        </div>
      </AdminPanelLayout>
    );
  }

  return (
    <AdminPanelLayout title="Edit Ticket" showSearch={false}>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Ticket</CardTitle>
            <CardDescription>
              Perbarui informasi ticket - ID: {ticket.id?.slice(-8).toUpperCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, handleFormError)}
                className="space-y-6"
              >
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 rounded-full">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Info Dasar</span>
                    </TabsTrigger>
                    <TabsTrigger value="status" className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Status</span>
                    </TabsTrigger>
                    <TabsTrigger value="assignment" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="hidden sm:inline">Penugasan</span>
                    </TabsTrigger>
                    <TabsTrigger value="media" className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Media</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab: Info Dasar */}
                  <TabsContent value="basic" className="space-y-6 mt-6">
                    <FormField
                      form={form}
                      name="title"
                      label="Judul Ticket"
                      placeholder="Masukkan judul ticket"
                      disabled={isLoading}
                    />

                    <FormField
                      form={form}
                      name="description"
                      label="Deskripsi"
                      placeholder="Masukkan deskripsi masalah"
                      type="textarea"
                      disabled={isLoading}
                    />

                    <FormField
                      form={form}
                      name="service_id"
                      label="Layanan"
                      placeholder="Pilih layanan"
                      type="select"
                      selectOptions={serviceOptions}
                      disabled={isLoading}
                    />
                  </TabsContent>

                  {/* Tab: Status & Priority */}
                  <TabsContent value="status" className="space-y-6 mt-6">
                    <FormField
                      form={form}
                      name="status"
                      label="Status Ticket"
                      type="select"
                      selectOptions={statusOptions}
                      disabled={isLoading}
                    />

                    <FormField
                      form={form}
                      name="priority"
                      label="Prioritas"
                      type="select"
                      selectOptions={priorityOptions}
                      disabled={isLoading}
                    />

                    {showImageUpload && (
                      <div className="rounded-lg border border-dashed p-6 bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-2">
                          💡 Tip: Upload gambar dokumentasi penyelesaian ticket
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab: Penugasan */}
                  <TabsContent value="assignment" className="space-y-6 mt-6">
                    <FormField
                      form={form}
                      name="assigned_to"
                      label="Teknisi"
                      placeholder="Pilih teknisi"
                      type="select"
                      selectOptions={technicianOptions}
                      disabled={isLoading}
                    />

                    <div className="rounded-lg border p-4 bg-muted/50">
                      <h4 className="font-medium mb-2">Informasi Penugasan</h4>
                      <p className="text-sm text-muted-foreground">
                        Mengubah teknisi akan memperbarui jadwal kerja yang terkait dengan ticket ini.
                      </p>
                    </div>
                  </TabsContent>

                  {/* Tab: Media/Image */}
                  <TabsContent value="media" className="space-y-6 mt-6">
                    {showImageUpload ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Upload Gambar Dokumentasi
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={isLoading}
                            className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-primary file:text-primary-foreground
                              hover:file:bg-primary/90
                              disabled:opacity-50"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Upload gambar sebagai bukti penyelesaian ticket
                          </p>
                        </div>

                        {imagePreview && (
                          <div className="relative">
                            <Image
                              src={imagePreview}
                              alt="Preview"
                              width={400}
                              height={300}
                              className="max-h-64 rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                              }}
                            >
                              Hapus
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 border rounded-lg bg-muted/50">
                        <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                          Upload gambar hanya tersedia saat status <strong>RESOLVED</strong> atau <strong>CLOSED</strong>
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Ubah status ticket ke tab Status untuk mengupload gambar
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t">
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
                    {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
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

export default EditTicket;