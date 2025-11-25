import {
  Users,
  LayoutGrid,
  LucideIcon,
  Wifi,
  PhoneForwardedIcon,
  UserCircle2,
  Calendar,
  Ticket,
  DollarSign
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
  roles?: string[];
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
  roles?: string[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
  roles?: string[];
};

function hasAccess(userRole: string, allowedRoles?: string[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
}

export function getMenuList(pathname: string, userRole?: string): Group[] {
  const fullMenuList: Group[] = [
    {
      groupLabel: "",
      menus: [
        {
          href: "/admin/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: [],
        }
      ]
    },
    {
      groupLabel: "Main",
      menus: [
        {
          href: "/admin/ticket",
          label: "Ticket",
          icon: Ticket,
          roles: ["TENANT_OWNER", "TENANT_ADMIN", "TEKNISI"]
        },
        {
          href: "/admin/schedule",
          label: "Kalender Kerja",
          icon: Calendar,
          roles: ["TENANT_OWNER", "TENANT_ADMIN", "TEKNISI"]
        },
        {
          href: "/admin/customer",
          label: "Pelanggan",
          icon: UserCircle2,
          roles: ["TENANT_OWNER", "TENANT_ADMIN", "TEKNISI"]
        },
      ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/admin/whatsapp",
          label: "Whatsapp",
          icon: PhoneForwardedIcon,
          roles: ["TENANT_OWNER", "TENANT_ADMIN"]
        },
        {
          href: "/admin/package",
          label: "Paket Internet",
          icon: Wifi,
          roles: ["TENANT_OWNER", "TENANT_ADMIN"]
        },
        {
          href: "/admin/user",
          label: "Pengguna",
          icon: Users,
          roles: ["SAAS_SUPER_ADMIN", "TENANT_OWNER"]
        },
      ],
    }
  ];

  if (!userRole) {
    return fullMenuList;
  }

  return fullMenuList
    .filter(group => hasAccess(userRole, group.roles))
    .map(group => ({
      ...group,
      menus: group.menus
        .filter(menu => hasAccess(userRole, menu.roles))
        .map(menu => ({
          ...menu,
          submenus: menu.submenus?.filter(submenu =>
            hasAccess(userRole, submenu.roles)
          )
        }))
    }))
    .filter(group => group.menus.length > 0);
}