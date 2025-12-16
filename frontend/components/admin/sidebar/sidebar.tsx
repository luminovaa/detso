"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
// [REMOVED] import { Skeleton } from "@/components/ui/skeleton"; 
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { SidebarToggle } from "./sidebar-toogle";
import { Menu } from "./menu";

// Import Auth & API
import { useAuth } from "@/components/admin/context/auth-provider";
import { getTenantLogo } from "@/api/tenant.api"; 

export function Sidebar() {
  const sidebar = useStore(useSidebar, (x) => x);
  
  // Ambil info user & tenant
  const { user, isSuperAdmin } = useAuth();
  
  // State untuk logo URL
  const [logoUrl, setLogoUrl] = useState<string>("/logo.png"); 
  // const [isLogoLoading, setIsLogoLoading] = useState(false); // Tidak dipakai jika skeleton hilang

  // Fetch Logo Effect
  useEffect(() => {
    if (isSuperAdmin) return;

    const fetchLogo = async () => {
      if (user?.tenantId) {
        try {
          const response = await getTenantLogo(user.tenantId);
          const fetchedUrl = response.data?.data?.logo_url;
          
          if (fetchedUrl) {
            setLogoUrl(fetchedUrl);
          }
        } catch (error) {
          console.error("Gagal memuat logo tenant:", error);
        } 
      }
    };

    fetchLogo();
  }, [user, isSuperAdmin]);

  // [MODIFIED] Handle Loading Sidebar State (Zustand)
  // Jika sidebar belum siap (hydration), return null agar tidak error saat destructuring,
  // tapi tidak menampilkan skeleton visual.
  if (!sidebar) return null;

  const { isOpen, toggleOpen, getOpenState, setIsHover } = sidebar;

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen transition-[width] ease-in-out duration-300 bg-white dark:bg-zinc-950 border-r",
        "lg:block",
        !getOpenState() ? "w-[90px]" : "w-72"
      )}
    >
      <div className="hidden lg:block">
        <SidebarToggle isOpen={isOpen} setIsOpen={toggleOpen} />
      </div>

      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="relative h-full flex flex-col px-3 py-4 overflow-y-auto"
      >
        <Button
          className={cn(
            "transition-transform ease-in-out duration-300 mb-6 mt-2", 
            !getOpenState() ? "translate-x-0 justify-center px-0" : "translate-x-0 justify-start px-2"
          )}
          variant="link"
          asChild
        >
          <Link href="/dashboard" className="flex items-center gap-2 h-12">
            <div className={cn(
                "relative flex items-center justify-center transition-all duration-300",
                !getOpenState() ? "w-10 h-10" : "w-full h-12"
            )}>
                <Image
                  src={logoUrl!}
                  alt="Tenant Logo"
                  width={getOpenState() ? 140 : 40} 
                  height={getOpenState() ? 50 : 40}
                  className={cn(
                      "object-contain transition-all duration-300",
                      !getOpenState() ? "w-10 h-10" : "w-auto h-10" 
                  )}
                  priority 
                  onError={() => setLogoUrl("/logo.png")} 
                />
            </div>
          </Link>
        </Button>

        <Menu isOpen={getOpenState()} />
      </div>
    </aside>
  );
}