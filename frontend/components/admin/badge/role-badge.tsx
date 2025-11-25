import { Badge } from "@/components/ui/badge";
import { User } from "@/types/user.types"; // Pastikan path import sesuai

interface RoleBadgeProps {
    role: User['role'] | string; // String ditambahkan untuk safety
}

export function RoleBadge({ role }: RoleBadgeProps) {
    let roleText: string;
    let roleColor: string;

    switch(role) {
        case 'SAAS_SUPER_ADMIN':
            roleText = 'Super Admin';
            // Menggunakan warna Kuning/Gold (sesuai --accent)
            // border-yellow-200 agar ada border tipis yang rapi
            roleColor = 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
            break;

        case 'TENANT_OWNER':
            roleText = 'Owner';
            // Menggunakan warna Biru (sesuai --primary)
            roleColor = 'bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200';
            break;

        case 'TENANT_ADMIN':
            roleText = 'Admin';
            // Menggunakan warna Hijau/Emerald (Manajerial)
            roleColor = 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200';
            break;

        case 'TENANT_TEKNISI':
            roleText = '    ';
            // Menggunakan warna Slate/Abu (Lapangan/Teknis)
            roleColor = 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200';
            break;

        default:
            // Fallback jika ada role baru atau format salah
            // Menghapus underscore dan uppercase
            roleText = role ? role.replace(/_/g, ' ').toUpperCase() : 'USER';
            roleColor = 'bg-gray-100 text-gray-800 border-gray-200';
    }

    return (
        <Badge 
            variant="outline" 
            className={`font-semibold border ${roleColor} rounded-full px-3 py-0.5 text-[10px] tracking-wide shadow-sm`}
        >
            {roleText}
        </Badge>
    )
}