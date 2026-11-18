import React, { useCallback, useMemo, useState } from "react";
import { View, ScrollView, TouchableOpacity, Linking, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "../../global/card";
import { Text } from "../../global/text";
import { ImageViewer, ImageViewerImage } from "../../global/image-viewer";
import { CustomerLocationMap } from "@/src/components/screens/customer/customer-location-map";
import { CustomerDocument, ServicePhoto } from "@/src/lib/types";
import { hasAnyValidLocation } from "@/src/lib/map-utils";
import { isTechnicianRole } from "@/src/lib/route-roles";
import { customerService } from "@/src/features/customer/service";
import { useAuthStore } from "@/src/features/auth/store";
import { useT } from "@/src/features/i18n/store";
import { useThemeColor } from '@/src/lib/theme-colors';

interface CustomerServiceItem {
  id: string;
  package_name: string;
  address: string | null;
  lat: string | null;
  long: string | null;
  photos: ServicePhoto[];
}

interface CustomerDocumentsTabProps {
  customerId: string;
  documents: CustomerDocument[];
  services?: CustomerServiceItem[];
  customerName: string;
  hasInstallationReport?: boolean;
}

const PHOTO_ORDER: Record<string, number> = {
  rumah_depan: 1,
  rumah_sisi_kanan: 2,
  rumah_samping: 2,
  rumah_sisi_kiri: 3,
  rumah_jauh: 3,
  denganpelanggan: 4,
  alat: 5,
};

export function CustomerDocumentsTab({
  customerId,
  documents,
  services = [],
  customerName,
  hasInstallationReport = false,
}: CustomerDocumentsTabProps) {
  const { t } = useT();
  const colors = useThemeColor();
  const user = useAuthStore((s) => s.user);
  const isTeknisi = isTechnicianRole(user?.role);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<ImageViewerImage[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const getPhotoLabel = useCallback(
    (photoType: string) => {
      switch (photoType) {
        case "rumah_depan":
          return t("customer.photoFront");
        case "rumah_sisi_kanan":
          return t("customer.photoSide");
        case "rumah_samping":
          return t("customer.photoHouseSide");
        case "rumah_sisi_kiri":
          return t("customer.photoFar");
        case "rumah_jauh":
          return t("customer.photoHouseFar");
        case "denganpelanggan":
          return t("customer.photoCustomer");
        case "alat":
          return t("customer.photoDevice");
        default:
          return photoType;
      }
    },
    [t],
  );

  // Hide KTP document from technician accounts
  const visibleDocuments = useMemo(
    () =>
      isTeknisi
        ? documents.filter((d) => d.document_type.toLowerCase() !== "ktp")
        : documents,
    [documents, isTeknisi],
  );

  // Collect installation photos from services in deterministic order
  const installationPhotos = useMemo(() => {
    const multipleServices = services.length > 1;
    return services.flatMap((svc) =>
      [...(svc.photos || [])]
        .sort(
          (a, b) =>
            (PHOTO_ORDER[a.photo_type] ?? 99) - (PHOTO_ORDER[b.photo_type] ?? 99),
        )
        .map((photo) => ({
          id: photo.id,
          uri: photo.photo_url,
          label: getPhotoLabel(photo.photo_type),
          subtitle: multipleServices ? svc.package_name : null,
        })),
    );
  }, [services, getPhotoLabel]);

  const hasValidLocation = useMemo(
    () => hasAnyValidLocation(services),
    [services],
  );

  const showPdfReport = !isTeknisi && hasInstallationReport;

  const docViewerImages: ImageViewerImage[] = useMemo(
    () =>
      visibleDocuments
        .filter(
          (d) =>
            !d.document_url.endsWith(".pdf") &&
            d.document_type.toLowerCase() !== "pdf",
        )
        .map((d) => ({
          uri: d.document_url,
          label: d.document_type,
        })),
    [visibleDocuments],
  );

  const openDocViewer = useCallback(
    (index: number) => {
      const doc = visibleDocuments[index];
      if (!doc) return;
      if (doc.document_url.endsWith(".pdf") || doc.document_type.toLowerCase() === "pdf") {
        Linking.openURL(doc.document_url);
        return;
      }
      const imageIndex = docViewerImages.findIndex((img) => img.uri === doc.document_url);
      if (imageIndex >= 0) {
        setViewerImages(docViewerImages);
        setViewerIndex(imageIndex);
        setViewerVisible(true);
      }
    },
    [visibleDocuments, docViewerImages],
  );

  const openInstallationPhotoViewer = useCallback(
    (index: number) => {
      setViewerImages(
        installationPhotos.map((p) => ({
          uri: p.uri,
          label: p.subtitle ? `${p.label} • ${p.subtitle}` : p.label,
        })),
      );
      setViewerIndex(index);
      setViewerVisible(true);
    },
    [installationPhotos],
  );

  const [pdfLoading, setPdfLoading] = useState(false);

  const openInstallationPdf = useCallback(
    async (errorMessage: string) => {
      setPdfLoading(true);
      try {
        const signedUrl = await customerService.getSignedPdfUrl(customerId);
        await Linking.openURL(signedUrl);
      } catch {
        Alert.alert(t("common.error"), errorMessage);
      } finally {
        setPdfLoading(false);
      }
    },
    [customerId, t],
  );

  const handleViewPdf = useCallback(
    () => openInstallationPdf(t("customer.pdfViewError")),
    [openInstallationPdf, t],
  );

  const handleDownloadPdf = useCallback(
    () => openInstallationPdf(t("customer.pdfDownloadError")),
    [openInstallationPdf, t],
  );

  const isEmpty =
    visibleDocuments.length === 0 &&
    installationPhotos.length === 0 &&
    !hasValidLocation &&
    !showPdfReport;

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Installation Photos Grid */}
        {installationPhotos.length > 0 && (
          <View className="mb-6">
            <Text weight="bold" className="text-base text-foreground mb-3 px-1">
              {t("customer.installationPhotos")} ({installationPhotos.length})
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {installationPhotos.map((photo, idx) => (
                <TouchableOpacity
                  key={photo.id}
                  activeOpacity={0.7}
                  onPress={() => openInstallationPhotoViewer(idx)}
                  className="w-[47%] rounded-xl border border-border overflow-hidden bg-card"
                >
                  <DocThumb uri={photo.uri} />
                  <View className="p-2">
                    <Text weight="medium" className="text-xs text-foreground" numberOfLines={1}>
                      {photo.label}
                    </Text>
                    {photo.subtitle && (
                      <Text className="text-[11px] text-muted-foreground mt-0.5" numberOfLines={1}>
                        {photo.subtitle}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* House Location Pin Map */}
        {hasValidLocation && (
          <View className="mb-6">
            <Text weight="bold" className="text-base text-foreground mb-3 px-1">
              {t("customer.houseLocationMap")}
            </Text>
            <CustomerLocationMap services={services} />
          </View>
        )}

        {/* Documents Grid (Owner & Admin see KTP; Teknisi hides KTP) */}
        {visibleDocuments.length > 0 && (
          <View className="mb-6">
            <Text weight="bold" className="text-base text-foreground mb-3 px-1">
              {t("customer.documentsTitle")} ({visibleDocuments.length})
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {visibleDocuments.map((doc, idx) => {
                const isPdf = doc.document_url.endsWith(".pdf") || doc.document_type.toLowerCase() === "pdf";
                return (
                  <TouchableOpacity
                    key={doc.id}
                    activeOpacity={0.7}
                    onPress={() => openDocViewer(idx)}
                    className="w-[47%] rounded-xl border border-border overflow-hidden bg-card"
                  >
                    {isPdf ? (
                      <View className="w-full aspect-[3/4] items-center justify-center bg-muted">
                        <Ionicons name="document-text" size={36} color={colors.icon} />
                      </View>
                    ) : (
                      <DocThumb uri={doc.document_url} />
                    )}
                    <View className="p-2">
                      <Text weight="medium" className="text-xs text-foreground" numberOfLines={1}>
                        {doc.document_type}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Empty state */}
        {isEmpty && (
          <Card className="rounded-2xl mb-6 border-border/40">
            <View className="p-6 items-center">
              <Ionicons name="folder-open-outline" size={32} color={colors.icon} />
              <Text className="text-sm text-muted-foreground mt-2">{t("customer.noDocuments")}</Text>
            </View>
          </Card>
        )}

        {/* PDF Section - Hidden for technician accounts */}
        {showPdfReport && (
          <View className="mb-4">
            <Text weight="bold" className="text-base text-foreground mb-3 px-1">
              {t("customer.installationReportPdfTitle")}
            </Text>

            <Card className="rounded-2xl border-border/40">
              <View className="p-4 gap-y-3">
                <View className="flex-row items-center gap-x-3">
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                    <Ionicons name="document-text" size={20} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text weight="semibold" className="text-sm text-foreground">
                      {t("customer.installationReportTitle")}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {t("customer.pdfReportFor", { name: customerName })}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-x-3">
                  <TouchableOpacity
                    onPress={handleViewPdf}
                    disabled={pdfLoading}
                    className={`flex-1 flex-row items-center justify-center gap-x-2 min-h-11 py-2.5 rounded-xl border border-primary ${pdfLoading ? "opacity-50" : ""}`}
                  >
                    <Ionicons name="eye-outline" size={16} color={colors.primary} />
                    <Text weight="semibold" className="text-sm text-primary">
                      {pdfLoading ? t("common.loading") : t("customer.viewBtn")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDownloadPdf}
                    disabled={pdfLoading}
                    className={`flex-1 flex-row items-center justify-center gap-x-2 min-h-11 py-2.5 rounded-xl bg-primary ${pdfLoading ? "opacity-50" : ""}`}
                  >
                    <Ionicons name="download-outline" size={16} color={colors.white} />
                    <Text weight="semibold" className="text-sm text-primary-foreground">
                      {pdfLoading ? t("common.loading") : t("customer.downloadBtn")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Image Viewer */}
      <ImageViewer
        visible={viewerVisible}
        images={viewerImages}
        initialIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
      />
    </>
  );
}

/** Document thumbnail styled via outer NativeWind container to avoid inline styles */
function DocThumb({ uri }: { uri: string }) {
  return (
    <View className="w-full aspect-[3/4] bg-muted overflow-hidden">
      <Image source={{ uri }} className="w-full h-full" resizeMode="contain" />
    </View>
  );
}
