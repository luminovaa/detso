import { FileDropzone } from "@/components/admin/dropzone-reusable";
import { PhotoData } from "@/types/customer.types";

interface StepProps {
  isLoading: boolean;
  photos: PhotoData[];
  onUpdatePhoto: (type: string, file: File | null) => void;
}

export function Step3HouseFront({ isLoading, photos, onUpdatePhoto }: StepProps) {
  // Helper untuk mencari foto berdasarkan tipe
  const photoType = "rumah_depan";
  const photoIndex = photos.findIndex((p) => p.type === photoType);

  // Jangan render jika belum diinisialisasi di parent
  if (photoIndex === -1) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Foto Rumah Depan</h3>
      <FileDropzone
        onFileUpload={(file) => onUpdatePhoto(photoType, file)}
        fileType="image"
        label="Foto Rumah Bagian Depan *"
        placeholder="Tarik & lepas foto rumah depan"
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".gif"] }}
        disabled={isLoading}
      />
    </div>
  );
}