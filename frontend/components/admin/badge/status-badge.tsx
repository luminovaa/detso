import { Badge } from "@/components/ui/badge";
import { Service_Connection } from "@/types/customer.types";

interface StatusCustomerBadgeProps {
    status: Service_Connection['status'];
}

export function StatusCustomerBadge({ status }: StatusCustomerBadgeProps) {
    let statusText: string;
    let statusColor: string;

    switch(status) {
        case 'ACTIVE':
            statusText = 'Aktif';
            statusColor = 'bg-emerald-100 text-emerald-800';
            break;
        case 'INACTIVE':
            statusText = 'Tidak Aktif';
            statusColor = 'bg-gray-100 text-gray-800';
            break;
        default:
            statusText = 'Status';
            statusColor = 'bg-gray-100 text-gray-800';
    }

    return (
        <Badge className={`font-medium ${statusColor} rounded-full px-2 py-1`}>
            {statusText}
        </Badge>
    )
}