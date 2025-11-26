import { FileDropzone } from "@/components/admin/dropzone-reusable";
import { PhotoData } from "@/types/customer.types";

interface StepProps {
  isLoading: boolean;
  photos: PhotoData[];
  onUpdatePhoto: (type: string, file: File | null) => void;
}

export function Step4HouseAdditional({ isLoading, photos, onUpdatePhoto }: StepProps) {
  const requiredTypes = [
    { value: "rumah_samping", label: "Rumah Tampak Samping" },
    { value: "rumah_jauh", label: "Rumah Tampak Jauh" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Foto Rumah Tambahan</h3>
      {requiredTypes.map(({ value, label }) => {
        // Cek apakah state photo sudah ada
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