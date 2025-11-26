import { FileDropzone } from "@/components/admin/dropzone-reusable";
import { PhotoData } from "@/types/customer.types";

interface StepProps {
  isLoading: boolean;
  photos: PhotoData[];
  onUpdatePhoto: (type: string, file: File | null) => void;
}

export function Step5FinalEvidence({ isLoading, photos, onUpdatePhoto }: StepProps) {
  const requiredTypes = [
    { value: "denganpelanggan", label: "Foto dengan Pelanggan" },
    { value: "alat", label: "Foto Alat" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Foto Pelanggan & Alat</h3>
      {requiredTypes.map(({ value, label }) => {
        const exists = photos.some((p) => p.type === value);
        if (!exists) return null;

        return (
          <FileDropzone
            key={value}
            onFileUpload={(file) => onUpdatePhoto(value, file)}
            fileType="image"
            label={`${label} *`}
            accept={{ "image/*": [".jpg", ".jpeg", ".png", ".gif"] }}
            disabled={isLoading}
          />
        );
      })}
    </div>
  );
}