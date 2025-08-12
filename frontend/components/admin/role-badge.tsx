import { User } from "@/types/user.types";
import { Badge } from "../ui/badge";

interface RoleBadgeProps {
    role: User['role'];
}

export function RoleBadge({ role }: RoleBadgeProps) {
    let roleText: string;
    let roleColor: string;

    switch(role) {
        case 'SUPER_ADMIN':
            roleText = 'Super Admin';
            roleColor = 'bg-purple-100 text-purple-800';
            break;
        case 'ADMIN':
            roleText = 'Admin';
            roleColor = 'bg-blue-100 text-blue-800';
            break;
        case 'TEKNISI':
            roleText = 'Teknisi';
            roleColor = 'bg-green-100 text-green-800';
            break;
        default:
            roleText = 'Pengguna';
            roleColor = 'bg-gray-100 text-gray-800';
    }

    return (
        <Badge className={`font-medium ${roleColor} rounded-full px-2 py-1`}>
            {roleText}
        </Badge>
    )
}