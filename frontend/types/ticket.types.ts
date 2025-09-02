import z from "zod";
import { Customer, Service_Connection } from "./customer.types";
import { User } from "./user.types";

export type Ticket = {
    id?: string;
    customer_id?: string;
    service_id?: string;
    title?: string;
    description?: string;
    priority?: string;
    assigned_to?: string;
    status?: string;
    created_at?: Date;
    updated_at?: Date;
    resolved_at?: Date;
    customer?: Customer;
    type?: string;
    service?: Service_Connection;
    technician?: User;
    ticket_history?: Ticket_History[];
}

export type Ticket_History = {
    id?: string;
    ticket_id?: string;
    action?: string;
    description?: string;
    created_by?: string;
    created_at?: Date;
    image?: string;
    ticket: Ticket;
    user: User;
}

export const createTicketSchema = z.object({
    service_id: z.string().optional(),
    title: z.string().min(5, 'Judul ticket minimal 5 karakter'),
    description: z.string().optional(),
    type: z.enum(['PROBLEM', 'UPGRADE', 'DOWNGRADE']).optional().default('PROBLEM'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
    assigned_to: z.string().optional()
});

export type CreateTicketForm = z.infer<typeof createTicketSchema>;