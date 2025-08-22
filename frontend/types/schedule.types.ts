import z from "zod";
import { Ticket } from "./ticket.types";
import { User } from "./user.types";

export type Schedule = {
    id?: string;
    ticket_id?: string;
    technician_id?: string;
    start_time?: Date;
    end_time?: Date;
    status?: string;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
    technician?: User;
    ticket?: Ticket;
}

export const createWorkScheduleSchema = z.object({
    title: z.string().optional(),
    technician_id: z.string().min(1, "Teknisi harus dipilih"),
    start_date: z.string().optional(),
    start_time: z.string().min(1, "Waktu mulai harus diisi").optional(),
    end_date: z.string().optional(),
    end_time: z.string().optional(),
    status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
    notes: z.string().optional(),
});


export type CreateWorkSchedule = z.infer<typeof createWorkScheduleSchema>;