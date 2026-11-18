import api from "@/src/lib/api";
import { TicketPriority, TicketType } from "@/src/lib/types";
import { BadgeVariantKey } from "@/src/lib/badge-variants";
import { SelectOption } from "@/src/components/global/select-searchable";

export const TICKET_PRIORITY_OPTIONS: { value: TicketPriority; labelKey: string; variant: BadgeVariantKey }[] = [
  { value: "LOW", labelKey: "ticket.priorityLow", variant: "neutral" },
  { value: "MEDIUM", labelKey: "ticket.priorityMedium", variant: "info" },
  { value: "HIGH", labelKey: "ticket.priorityHigh", variant: "warning" },
  { value: "URGENT", labelKey: "ticket.priorityUrgent", variant: "error" },
];

export const TICKET_TYPE_OPTIONS: { value: TicketType; labelKey: string; variant: BadgeVariantKey }[] = [
  { value: "PROBLEM", labelKey: "ticket.typeProblem", variant: "error" },
  { value: "UPGRADE", labelKey: "ticket.typeUpgrade", variant: "success" },
  { value: "DOWNGRADE", labelKey: "ticket.typeDowngrade", variant: "warning" },
];

interface TicketServiceDto {
  id: string;
  package_name: string;
  customer?: {
    name?: string | null;
  } | null;
}

interface TicketTechnicianDto {
  id: string;
  username: string;
  profile?: {
    full_name?: string | null;
  } | null;
}

export async function fetchTicketServiceOptions(
  search: string,
  page: number,
): Promise<{ data: SelectOption[]; hasNextPage: boolean }> {
  const res = await api.get("/service-connection", { params: { search, page, limit: 10 } });
  const services: TicketServiceDto[] = res.data?.data?.services || [];
  return {
    data: services.map((s) => ({
      label: `${s.customer?.name || "-"} - ${s.package_name}`,
      value: s.id,
    })),
    hasNextPage: Boolean(res.data?.data?.pagination?.hasNextPage),
  };
}

export async function fetchTicketTechnicianOptions(
  search: string,
  page: number,
): Promise<{ data: SelectOption[]; hasNextPage: boolean }> {
  const res = await api.get("/user", { params: { search, page, limit: 10, role: "TENANT_TEKNISI" } });
  const users: TicketTechnicianDto[] = res.data?.data?.users || [];
  return {
    data: users.map((u) => ({
      label: u.profile?.full_name || u.username,
      value: u.id,
    })),
    hasNextPage: Boolean(res.data?.data?.pagination?.hasNextPage),
  };
}
