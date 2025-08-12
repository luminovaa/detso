import { Customer } from "./customer.types";
import { z } from "zod";

export type Whatsapp_logs = {
    id?: string;
    customer_id: string;
    phone_number: string;
    message_type: string;
    status: string;
    error_message?: string;
    sent_at?: Date;
    created_at?: Date;
    updated_at?: Date;
    customer?: Customer;
}

export const sendMessageSchema = z.object({
    phone_number: z.string().min(10, "Nomor telepon minimal 10 karakter"),
    message: z.string().min(1, "Pesan tidak boleh kosong"),
});
export type SendMessageFormData = z.infer<typeof sendMessageSchema>;