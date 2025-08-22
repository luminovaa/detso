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