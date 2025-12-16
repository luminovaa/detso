import { useDropzone, Accept } from "react-dropzone";
import { Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Image from "next/image";

type FileDropzoneProps = {
  onFileUpload: (file: File | null) => void;
  accept?: Accept;
  maxFiles?: number;
  disabled?: boolean;
  placeholder?: string;
  fileType?: "document" | "image";
  label?: string;
  maxSizeMB?: number;
  initialPreviewUrl?: string | null;
  
  // Validasi Resolusi
  minWidth?: number; 
  minHeight?: number;
  maxWidth?: number; // [NEW] Batas lebar maksimal
  maxHeight?: number; // [NEW] Batas tinggi maksimal
};

export function FileDropzone({
  onFileUpload,
  accept = { "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"] },
  maxFiles = 1,
  disabled = false,
  placeholder = "Klik atau seret file di sini",
  fileType = "image",
  label = "Upload File",
  maxSizeMB = 5,
  initialPreviewUrl,
  minWidth = 100, 
  minHeight = 100,
  maxWidth,  // [NEW] Default undefined (tidak dibatasi)
  maxHeight, // [NEW] Default undefined (tidak dibatasi)
}: FileDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPreviewUrl && !file) {
      setPreviewUrl(initialPreviewUrl);
    }
  }, [initialPreviewUrl, file]);

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        let isValid = true;
        let errorMsg = "";

        // 1. Cek Minimal
        if (width < minWidth || height < minHeight) {
          isValid = false;
          errorMsg = `Resolusi terlalu kecil. Min: ${minWidth}x${minHeight}px.`;
        }

        // 2. Cek Maksimal (Jika props diberikan)
        if (maxWidth && width > maxWidth) {
          isValid = false;
          errorMsg = `Lebar gambar terlalu besar (Max: ${maxWidth}px).`;
        }
        
        if (maxHeight && height > maxHeight) {
          isValid = false;
          errorMsg = `Tinggi gambar terlalu besar (Max: ${maxHeight}px). `;
        }

        if (!isValid) {
          setError(errorMsg);
          resolve(false);
        } else {
          setError(null);
          resolve(true);
        }
      };

      img.onerror = () => {
        setError("File bukan gambar yang valid.");
        resolve(false);
      };
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      const uploadedFile = acceptedFiles[0];
      if (!uploadedFile) return;

      if (uploadedFile.size > maxSizeMB * 1024 * 1024) {
        setError(`Ukuran file terlalu besar! Maksimal ${maxSizeMB}MB.`);
        return;
      }

      if (fileType === "image") {
        const isValidDimension = await validateImageDimensions(uploadedFile);
        if (!isValidDimension) return;
      }

      setFile(uploadedFile);
      setPreviewUrl(URL.createObjectURL(uploadedFile));
      onFileUpload(uploadedFile);
      setError(null);
    },
    accept,
    maxFiles,
    disabled,
    multiple: false,
  });

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    onFileUpload(null);
    setError(null);
  };

  // Helper text untuk menampilkan aturan dimensi
  const dimensionRuleText = () => {
    const minText = `${minWidth}x${minHeight}`;
    const maxText = maxWidth && maxHeight ? ` • Max ${maxWidth}x${maxHeight}` : "";
    return `Min ${minText}px${maxText}`;
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      
      {error && (
        <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded border border-red-200 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}

      {!previewUrl ? (
        <div
          {...getRootProps()}
          className={`relative p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 group
            ${isDragActive ? "border-blue-500 bg-blue-50/50 scale-[0.99]" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50/50"}
            ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className={`p-3 rounded-full ${isDragActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500"} transition-colors`}>
              {fileType === 'image' ? <ImageIcon className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isDragActive ? "Lepaskan file di sini" : placeholder}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {dimensionRuleText()} • Max {maxSizeMB}MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        // ... (Bagian Preview sama seperti sebelumnya) ...
        <div className="relative group overflow-hidden border rounded-xl bg-white shadow-sm w-full max-w-xs">
          <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center p-4">
             <Image
              src={previewUrl!}
              alt="Preview"
              fill
              className="object-contain shadow-sm"
              unoptimized
            />
          </div>
          {file && (
            <div className="px-4 py-2 border-t bg-gray-50">
                <p className="text-xs font-medium truncate text-gray-700">{file.name}</p>
                <p className="text-[10px] text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
          {!disabled && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-md"
                    onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
          )}
          {!disabled && (
             <div 
                {...getRootProps()} 
                className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors cursor-pointer -z-0"
             >
                 <input {...getInputProps()} />
             </div>
          )}
        </div>
      )}
    </div>
  );
}