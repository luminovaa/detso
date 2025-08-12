import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  Wifi,
  PhoneForwardedIcon,
  UserCircle2
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/admin/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Main",
      menus: [
        // {
        //   href: "",
        //   label: "Posts",
        //   icon: SquarePen,
        //   submenus: [
        //     {
        //       href: "/admin/posts",
        //       label: "All Posts"
        //     },
        //     {
        //       href: "/posts/new",
        //       label: "New Post"
        //     }
        //   ]
        // },
        // {
        //   href: "/categories",
        //   label: "Categories",
        //   icon: Bookmark
        // },
        {
          href: "/admin/customer",
          label: "Pelanggan",
          icon: UserCircle2
        }
      ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/admin/whatsapp",
          label: "Whastapp",
          icon: PhoneForwardedIcon
        },
        {
          href: "/admin/package",
          label: "Paket Internet",
          icon: Wifi
        },
        {
          href: "/admin/user",
          label: "Pengguna",
          icon: Users
        },
      ]
    }
  ];
}
