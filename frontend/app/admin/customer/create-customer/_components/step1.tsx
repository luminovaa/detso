import { UseFormReturn } from "react-hook-form";
import { FileText } from "lucide-react";
import { FormField } from "@/components/admin/form-field";
import { FileDropzone } from "@/components/admin/dropzone-reusable";
import { MobileFileUploader } from "@/components/admin/mobile-upload";

interface StepProps {
  form: UseFormReturn<any>;
  isLoading: boolean;
  onDocumentUpdate: (file: File | null) => void;
}

export function Step1PersonalData({
  form,
  isLoading,
  onDocumentUpdate,
}: StepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Data Pribadi</h3>

      <div className="flex items-center gap-2 mb-4 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="flex items-center md:w-1/2">
          <FileText className="h-5 w-5 text-blue-600 md:h-10 md:w-10" />
          <h3 className="text-lg font-semibold md:text-2xl">
            Upload KTP
          </h3>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full md:w-auto md:px-4 md:py-2">
          Kartu Tanda Penduduk
        </span>
      </div>

<div className="hidden md:block">
      <FileDropzone
        onFileUpload={onDocumentUpdate}
        accept={{
          "image/*": [".jpg", ".jpeg", ".png", ".gif"],
        }}
        fileType="document"
        label="Upload KTP *"
        placeholder="Tarik & lepas file KTP (IMG, max 5MB)"
        maxSizeMB={5}
        disabled={isLoading}
      />
      </div>

      <div className="block md:hidden">
        <MobileFileUploader
          onFileUpload={onDocumentUpdate}
          label="Upload KTP *"
          maxSizeMB={5}
          disabled={isLoading}
          accept="image/*"
        />
      </div>

      <FormField
        form={form}
        name="name"
        label="Nama Lengkap *"
        placeholder="Masukkan nama lengkap"
        disabled={isLoading}
      />
      <FormField
        form={form}
        name="nik"
        label="NIK *"
        placeholder="Masukkan NIK"
        disabled={isLoading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          form={form}
          name="phone"
          label="Nomor Telepon"
          placeholder="08..."
          disabled={isLoading}
        />
        <FormField
          form={form}
          name="email"
          label="Email"
          type="email"
          placeholder="email@example.com"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          form={form}
          name="birth_place"
          label="Tempat Lahir"
          placeholder="Kota lahir"
          disabled={isLoading}
        />
        <FormField
          form={form}
          name="birth_date"
          label="Tanggal Lahir"
          type="date"
          disabled={isLoading}
        />
      </div>

      <FormField
        form={form}
        name="address"
        label="Alamat Domisili *"
        type="textarea"
        placeholder="Masukkan alamat lengkap"
        disabled={isLoading}
      />
    </div>
  );
}
