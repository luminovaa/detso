"use client";

import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar/sidebar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AdminPanelLayoutProps {
  children: React.ReactNode;
  title?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

export default function AdminPanelLayout({
  children,
  title,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
}: AdminPanelLayoutProps) {
  const sidebar = useStore(useSidebar, (x) => x);
  if (!sidebar) return null;

  const { getOpenState, settings } = sidebar;
  
  return (
    <>
      <Sidebar />
      <main
        className={cn(
          "min-h-[calc(100vh_-_56px)] transition-[margin-left] ease-in-out duration-300",
          !settings.disabled && (!getOpenState() ? "lg:ml-[90px]" : "lg:ml-72")
        )}
      >
        <div className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            {title && (
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">{title}</h1>
            )}

            {showSearch && (
              <div className="relative w-full sm:w-64 lg:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-10 bg-white rounded-3xl"
                />
              </div>
            )}
          </div>

          {children}
        </div>
      </main>
    </>
  );
}