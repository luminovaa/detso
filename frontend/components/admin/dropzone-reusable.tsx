import { useDropzone, Accept } from "react-dropzone";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type FileDropzoneProps = {
  onFileUpload: (file: File) => void;
  accept?: Accept;
  maxFiles?: number;
  disabled?: boolean;
  placeholder?: string;
  showPreview?: boolean;
  fileType?: "document" | "image";
  label?: string;
  maxSizeMB?: number;
};

export function FileDropzone({
  onFileUpload,
  accept = { "image/*": [".jpg", ".jpeg", ".png", ".gif"] },
  maxFiles = 1,
  disabled = false,
  placeholder = "Tarik & lepas file di sini, atau klik untuk memilih",
  showPreview = true,
  fileType = "image",
  label = "Upload File",
  maxSizeMB = 5,
}: FileDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);

  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: (acceptedFiles) => {
      const uploadedFile = acceptedFiles[0];
      if (uploadedFile && uploadedFile.size <= maxSize) {
        setFile(uploadedFile);
        onFileUpload(uploadedFile);
      } else {
        alert(`File terlalu besar! Maksimal ${maxSizeMB}MB.`);
      }
    },
    accept,
    maxFiles,
    disabled,
    multiple: false,
  });

  const removeFile = () => {
    setFile(null);
    // Optional: trigger callback when removed
  };

  const fileIcon = fileType === "document" ? (
    <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
  ) : (
    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-green-500" />
  );

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      {!file ? (
        <div
          {...getRootProps()}
          className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />
          {fileIcon}
          <p className="text-sm">{placeholder}</p>
          <p className="text-xs text-gray-500">
            {Object.keys(accept)
              .map((type) => (type === "image/*" ? "JPG, PNG, GIF" : "PDF, dll"))
              .join(", ")}{" "}
            (Max {maxSizeMB}MB)
          </p>
        </div>
      ) : (
        <div className="p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {fileIcon}
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}