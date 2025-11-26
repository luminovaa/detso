"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCustomer } from "@/api/customer.api";
import { getPackages } from "@/api/package.api";
import { Loader2 } from "lucide-react";
import {
  createCustomerSchema,
  DocumentData,
  PhotoData,
} from "@/types/customer.types";
import { useToast } from "@/hooks/use-toast";
import { FormErrorToast, useErrorToast } from "@/components/admin/toast-reusable";
import { Package } from "@/types/package.types";
import { Step1PersonalData } from "./_components/step1";
import { Step2ServiceData } from "./_components/step2";
import { Step3HouseFront } from "./_components/step3";
import { Step4HouseAdditional } from "./_components/step4";
import { Step5FinalEvidence } from "./_components/step5";

// Import Components Steps
function CreateCustomer() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [document, setDocument] = useState<DocumentData>({ type: "ktp" });
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const { success } = useToast();
  const { showApiError } = useErrorToast();
  const [showFormErrors, setShowFormErrors] = useState(false);
  const [sameAsDomicile, setSameAsDomicile] = useState(false);

  const form = useForm({
    resolver: zodResolver(createCustomerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      nik: "",
      package_id: "",
      address: "",
      address_service: "",
      lat: "",
      long: "",
      birth_date: undefined,
      birth_place: "",
      notes: "",
      documents: [],
      photos: [],
    },
  });

  // Fetch Packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await getPackages();
        setPackages(response.data.data.packages);
      } catch (error) {
        console.error("Failed to fetch packages:", error);
      }
    };
    fetchPackages();
  }, []);

  // Address Sync Logic
  useEffect(() => {
    if (sameAsDomicile) {
      const domicileAddress = form.getValues("address");
      form.setValue("address_service", domicileAddress);
    }
  }, [form, sameAsDomicile, form.watch("address")]);

  // Photo Init Helper
  const getPhotoTypesForStep = (currentStep: number) => {
    switch (currentStep) {
      case 3: return ["rumah_depan"];
      case 4: return ["rumah_samping", "rumah_jauh"];
      case 5: return ["denganpelanggan", "alat"];
      default: return [];
    }
  };

  // Init Photos when entering step
  useEffect(() => {
    const requiredTypes = getPhotoTypesForStep(step);
    if (requiredTypes.length > 0) {
      setPhotos((prev) => {
        const existingTypes = prev.map((p) => p.type);
        const newPhotos = requiredTypes
          .filter((type) => !existingTypes.includes(type))
          .map((type) => ({ type }));
        
        return newPhotos.length > 0 ? [...prev, ...newPhotos] : prev;
      });
    }
  }, [step]);

  // Update State Wrappers
  const handleDocumentUpdate = (file: File | null) => {
    setDocument(prev => ({ ...prev, file: file ?? undefined }));
  };

  const handlePhotoUpdate = (type: string, file: File | null) => {
    setPhotos(prev => prev.map(p => p.type === type ? { ...p, file: file ?? undefined } : p));
  };

  // Navigation
  const nextStep = () => {
    setStep((prev) => (prev < 5 ? ((prev + 1) as 1 | 2 | 3 | 4 | 5) : 5));
    setShowFormErrors(false);
  };

  const prevStep = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4 | 5) : 1));
    setShowFormErrors(false);
  };

  // Submit
  const onSubmit = async () => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      const data = form.getValues();

      // Append Form Data
      Object.entries(data).forEach(([key, value]) => {
        if (value && key !== "documents" && key !== "photos") {
          const val = key === "birth_date" && value instanceof Date ? value.toISOString() : String(value);
          formData.append(key, val);
        }
      });

      // Append Document
      if (document.file) {
        formData.append("documents", JSON.stringify([{ type: "ktp" }]));
        formData.append("documents", document.file);
      }

      // Append Photos
      const validPhotos = photos.filter((p) => p.type && p.file);
      if (validPhotos.length > 0) {
        formData.append("photos", JSON.stringify(validPhotos.map((p) => ({ type: p.type }))));
        validPhotos.forEach((p) => { if(p.file) formData.append("photos", p.file); });
      }

      await createCustomer(formData);
      success(`Customer ${data.name} berhasil dibuat!`, { title: "Berhasil" });
      setTimeout(() => router.push("/admin/customer"), 2000);
    } catch (err: any) {
      showApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    const titles = {
        1: "Data Pribadi",
        2: "Data Layanan",
        3: "Upload Dokumen & Foto Rumah Depan",
        4: "Foto Rumah Samping & Jauh",
        5: "Foto dengan Pelanggan & Alat"
    }
    return titles[step] || "";
  };

  return (
    <AdminPanelLayout title="Tambah Customer Baru" showSearch={false}>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{getStepTitle()}</CardTitle>
            {/* Progress Bar */}
            <div className="flex mt-2 gap-1">
              {[1, 2, 3, 4, 5].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                    step >= stepNum ? "bg-blue-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                
                {/* Render Content Based on Step */}
                {step === 1 && <Step1PersonalData form={form} isLoading={isLoading} onDocumentUpdate={handleDocumentUpdate} />}
                {step === 2 && <Step2ServiceData form={form} isLoading={isLoading} packages={packages} sameAsDomicile={sameAsDomicile} setSameAsDomicile={setSameAsDomicile} />}
                {step === 3 && <Step3HouseFront isLoading={isLoading} photos={photos} onUpdatePhoto={handlePhotoUpdate} />}
                {step === 4 && <Step4HouseAdditional isLoading={isLoading} photos={photos} onUpdatePhoto={handlePhotoUpdate} />}
                {step === 5 && <Step5FinalEvidence isLoading={isLoading} photos={photos} onUpdatePhoto={handlePhotoUpdate} />}

                {/* Navigation Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading} className="rounded-3xl">
                      Sebelumnya
                    </Button>
                  )}

                  {step < 5 ? (
                    <Button type="button" onClick={nextStep} disabled={isLoading} className="rounded-3xl">
                      Selanjutnya
                    </Button>
                  ) : (
                    <Button type="button" onClick={onSubmit} disabled={isLoading} className="rounded-3xl">
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Customer"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>

            <FormErrorToast errors={form.formState.errors} isVisible={showFormErrors} onDismiss={() => setShowFormErrors(false)} />
          </CardContent>
        </Card>
      </div>
    </AdminPanelLayout>
  );
}

export default CreateCustomer;