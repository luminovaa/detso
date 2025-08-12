// components/profile/change-password-dialog.tsx
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { AirplayIcon, AirVent, Lock, MessageCircleDashed } from "lucide-react";
import { useErrorToast } from "@/components/admin/toast-reusable";
import { FormField } from "@/components/admin/form-field";
import { SendMessageFormData, sendMessageSchema } from "@/types/whatsapp.types";
import { sendMessage } from "@/api/whatsapp.api";

interface SendMessageDialogProps {
  onSuccess?: () => void; // tambahkan ini
}

export function SendMessageDialog({ onSuccess }: SendMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { showApiError } = useErrorToast();

  const form = useForm<SendMessageFormData>({
    resolver: zodResolver(sendMessageSchema),
    mode: "onSubmit",
    defaultValues: {
        phone_number: "",
        message: "",
    },
  });

  async function onSubmit(data: SendMessageFormData) {
    setLoading(true);
    try {

      const isValid = await form.trigger();
      if (!isValid) {
        setLoading(false);
        return;
      }
      await sendMessage(data);
      
      toast({
        title: "Berhasil!",
        description: "Pesan berhasil dikirim.",
      });
      
      form.reset();
      setOpen(false);

      if (onSuccess) {
        onSuccess();
    }
    } catch (error: any) {
      showApiError(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className="rounded-3xl">
        <Button variant="default" className="rouded-3xl">
          <MessageCircleDashed className="w-4 h-4 mr-2" />
            Kirim Pesan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kirim Pesan</DialogTitle>
          <DialogDescription>
            Kirim pesan WhatsApp ke nomor yang ditentukan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              form={form}
              name="phone_number"
              label="Nomer Telepon"
              type="text"
              placeholder="Masukkan nomor telepon"
              disabled={loading}
            />
            
            <FormField
              form={form}
              name="message"
              label="Pesan"
              type="textarea"
              placeholder="Masukkan pesan"
              disabled={loading}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Mengirim..." : "Kirim Pesan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}