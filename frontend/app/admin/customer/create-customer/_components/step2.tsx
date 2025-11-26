import { UseFormReturn } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/admin/form-field";
import { Package } from "@/types/package.types";

interface StepProps {
  form: UseFormReturn<any>;
  isLoading: boolean;
  packages: Package[];
  sameAsDomicile: boolean;
  setSameAsDomicile: (checked: boolean) => void;
}

export function Step2ServiceData({ form, isLoading, packages, sameAsDomicile, setSameAsDomicile }: StepProps) {
  
  const packageOptions = packages
    .filter((pkg) => typeof pkg.id === "string" && pkg.id !== undefined)
    .map((pkg) => ({
      value: pkg.id ?? "",
      label: `${pkg.name} - Rp ${pkg.price.toLocaleString("id-ID")}`,
    }));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Data Layanan</h3>
      <FormField
        form={form}
        name="package_id"
        label="Paket Layanan *"
        type="select"
        placeholder="Pilih paket layanan"
        selectOptions={packageOptions}
        disabled={isLoading}
      />
      
      <div className="flex items-center space-x-2 py-2">
        <Checkbox
          id="same-address"
          checked={sameAsDomicile}
          onCheckedChange={(checked) => setSameAsDomicile(!!checked)}
        />
        <label
          htmlFor="same-address"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Alamat instalasi sama dengan alamat domisili
        </label>
      </div>

      {!sameAsDomicile && (
        <FormField
          form={form}
          name="address_service"
          label="Alamat Instalasi *"
          type="textarea"
          placeholder="Masukkan alamat instalasi"
          disabled={isLoading}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField form={form} name="lat" label="Latitude" placeholder="-7.123456" disabled={isLoading} />
        <FormField form={form} name="long" label="Longitude" placeholder="112.123456" disabled={isLoading} />
      </div>
      
      <FormField form={form} name="notes" label="Catatan" type="textarea" placeholder="Catatan tambahan..." disabled={isLoading} />
    </div>
  );
}