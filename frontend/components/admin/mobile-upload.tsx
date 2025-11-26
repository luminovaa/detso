import { Camera, Image as ImageIcon, UploadCloud, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import Image from "next/image";

type MobileFileUploaderProps = {
  onFileUpload: (file: File | null) => void;
  accept?: string;
  label?: string;
  disabled?: boolean;
  maxSizeMB?: number;
};

export function MobileFileUploader({
  onFileUpload,
  accept = "image/*",
  label = "Upload File",
  disabled = false,
  maxSizeMB = 5,
}: MobileFileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        alert(`File terlalu besar! Maksimal ${maxSizeMB}MB.`);
        return;
      }
      setFile(selectedFile);
      onFileUpload(selectedFile);
      setShowDialog(false);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    onFileUpload(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
    setShowDialog(false);
  };

  const openGallery = () => {
    galleryInputRef.current?.click();
    setShowDialog(false);
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-semibold text-foreground">{label}</label>}

      {/* Input Hidden */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={handleFileChange}
      />
      <input
        type="file"
        accept={accept}
        className="hidden"
        ref={galleryInputRef}
        onChange={handleFileChange}
      />

      {/* AREA UPLOAD */}
      {!file ? (
        <div
          onClick={() => !disabled && setShowDialog(true)}
          className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-input bg-muted rounded-xl transition-all
            ${disabled ? "opacity-50 cursor-not-allowed" : "active:scale-95 cursor-pointer"}
          `}
        >
          <div className="p-3 bg-card rounded-full shadow-sm mb-2">
            <UploadCloud className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Sentuh untuk Upload</p>
          <p className="text-xs text-muted-foreground mt-1">Maks {maxSizeMB}MB</p>
        </div>
      ) : (
        <div className="relative p-3 border border-input rounded-xl bg-card shadow-sm flex items-center gap-3">
          <div className="h-14 w-14 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
            {file.type.startsWith("image/") ? (
              <Image
                src={URL.createObjectURL(file)}
                alt="Preview"
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={removeFile}
            disabled={disabled}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* DIALOG */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowDialog(false)} />

          <div className="relative w-full max-w-sm bg-card rounded-t-2xl sm:rounded-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Pilih Sumber Foto</h3>
              <button onClick={() => setShowDialog(false)} className="p-1 bg-muted rounded-full">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Kamera */}
              <button
                type="button"
                onClick={openCamera}
                className="w-full flex items-center gap-4 p-4 bg-primary/10 active:bg-primary/20 border border-primary/20 rounded-xl group"
              >
                <div className="p-3 bg-card rounded-full text-primary shadow-sm group-active:scale-95 transition-transform">
                  <Camera className="h-6 w-6" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">Ambil Foto</p>
                  <p className="text-xs text-muted-foreground">Gunakan kamera hp</p>
                </div>
                <ChevronRight className="h-5 w-5 text-primary/40" />
              </button>

              {/* Galeri */}
              <button
                type="button"
                onClick={openGallery}
                className="w-full flex items-center gap-4 p-4 bg-accent/10 active:bg-accent/20 border border-accent/20 rounded-xl group"
              >
                <div className="p-3 bg-card rounded-full text-accent shadow-sm group-active:scale-95 transition-transform">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">Galeri</p>
                  <p className="text-xs text-muted-foreground">Pilih dari penyimpanan</p>
                </div>
                <ChevronRight className="h-5 w-5 text-accent/40" />
              </button>
            </div>

            <button
              onClick={() => setShowDialog(false)}
              className="w-full mt-6 py-3 text-sm font-medium text-muted-foreground"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
