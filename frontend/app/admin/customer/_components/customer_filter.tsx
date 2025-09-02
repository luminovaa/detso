"use client";

import { getPackages } from "@/api/package.api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package } from "@/types/package.types";
import { useEffect, useState } from "react";

interface CustomerFiltersProps {
  selectedStatus: string | undefined;
  selectedPackage: string | undefined;
  onStatusChange: (value: string) => void;
  onPackageChange: (value: string) => void;
  onCreateCustomer: () => void;
  disabled?: boolean;
}

export function CustomerFilters({
  selectedStatus = "all",
  selectedPackage = "all",
  onStatusChange,
  onPackageChange,
  onCreateCustomer,
  disabled = false,
}: CustomerFiltersProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true);
      try {
        const response = await getPackages({
          limit: 100, // Ambil semua package atau batasi sesuai kebutuhan
        });
        setPackages(response.data.data.packages || []);
      } catch (error) {
        console.error("Gagal mengambil data package:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleStatusChange = (value: string) => {
    onStatusChange(value);
  };

  const handlePackageChange = (value: string) => {
    onPackageChange(value);
  };

  const handleCreateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateCustomer();
  };

  return (
    <div 
      className="flex flex-col sm:flex-row justify-end gap-3"
      onClick={(e) => e.stopPropagation()} // Tambahkan ini untuk mencegah bubbling dari container
    >
      <div className="flex flex-wrap gap-3">
        {/* Filter Status */}
        <div onClick={(e) => e.stopPropagation()}> {/* Wrap dengan div dan stop propagation */}
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px] rounded-3xl" disabled={disabled}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-3xl">
              <SelectItem className="rounded-3xl" value="all">
                Semua Status
              </SelectItem>
              <SelectItem className="rounded-3xl" value="ACTIVE">
                Aktif
              </SelectItem>
              <SelectItem className="rounded-3xl" value="INACTIVE">
                Tidak Aktif
              </SelectItem>
              <SelectItem className="rounded-3xl" value="SUSPENDED">
                Suspend
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter Package */}
        <div onClick={(e) => e.stopPropagation()}> {/* Wrap dengan div dan stop propagation */}
          <Select 
            value={selectedPackage} 
            onValueChange={handlePackageChange}
            disabled={disabled || isLoading}
          >
            <SelectTrigger className="w-[180px] rounded-3xl">
              <SelectValue placeholder={isLoading ? "Loading..." : "Semua Package"} />
            </SelectTrigger>
            <SelectContent className="rounded-3xl">
              <SelectItem className="rounded-3xl" value="all">
                Semua Package
              </SelectItem>
              {packages.map((pkg) => (
                <SelectItem
                  key={pkg.id}
                  className="rounded-3xl"
                  value={pkg.name}
                >
                  {pkg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        className="rounded-3xl"
        onClick={handleCreateClick}
        disabled={disabled}
      >
        Pelanggan Baru
      </Button>
    </div>
  );
}