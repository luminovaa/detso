import React, { useCallback, useState } from "react";
import { View, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";

import { Card } from "../../global/card";
import { Text } from "../../global/text";
import { ImageViewer, ImageViewerImage } from "../../global/image-viewer";
import { CustomerDocument } from "@/src/lib/types";
import { customerService } from "@/src/features/customer/service";

import { COLORS } from '@/src/lib/colors';
interface CustomerDocumentsTabProps {
  customerId: string;
  documents: CustomerDocument[];
  customerName: string;
  hasInstallationReport?: boolean;
}

export function CustomerDocumentsTab({ customerId, documents, customerName, hasInstallationReport = false }: CustomerDocumentsTabProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);


  const viewerImages: ImageViewerImage[] = documents
    .filter((d) => !d.document_url.endsWith(".pdf") && !d.document_url.includes("/api/files/signed"))
    .map((d) => ({
      uri: d.document_url,
      label: d.document_type,
    }));

  const openDocViewer = useCallback(
    (index: number) => {
      // If it's a PDF, open signed URL in browser
      const doc = documents[index];
      if (doc.document_url.endsWith(".pdf") || doc.document_url.includes("/api/files/signed")) {
        Linking.openURL(doc.document_url);
        return;
      }
      // Find the index in viewerImages (non-PDF only)
      const imageIndex = viewerImages.findIndex((img) => img.uri === doc.document_url);
      if (imageIndex >= 0) {
        setViewerIndex(imageIndex);
        setViewerVisible(true);
      }
    },
    [documents, viewerImages],
  );

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleViewPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const signedUrl = await customerService.getSignedPdfUrl(customerId);
      await Linking.openURL(signedUrl);
    } catch (error) {
      Alert.alert("Error", "Gagal membuka PDF. Pastikan laporan sudah tersedia.");
    } finally {
      setPdfLoading(false);
    }
  }, [customerId]);

  const handleDownloadPdf = useCallback(async () => {
    setPdfLoading(true);
    try {
      const signedUrl = await customerService.getSignedPdfUrl(customerId);
      await Linking.openURL(signedUrl);
    } catch (error) {
      Alert.alert("Error", "Gagal mengunduh PDF. Pastikan laporan sudah tersedia.");
    } finally {
      setPdfLoading(false);
    }
  }, [customerId]);

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Documents Grid */}
        {documents.length > 0 && (
          <View className="mb-6">
            <Text weight="bold" className="text-base text-foreground mb-3 px-1">
              Dokumen ({documents.length})
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {documents.map((doc, idx) => {
                const isPdf = doc.document_url.endsWith(".pdf") || doc.document_url.includes("/api/files/signed");
                return (
                  <TouchableOpacity
                    key={doc.id}
                    activeOpacity={0.7}
                    onPress={() => openDocViewer(idx)}
                    className="w-[47%] rounded-xl border border-border overflow-hidden bg-card"
                  >
                    {isPdf ? (
                      <View className="h-28 items-center justify-center bg-muted">
                        <Ionicons name="document-text" size={36} color={COLORS.neutral.gray[500]} />
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

        {/* Empty state - no documents AND no PDF */}
        {documents.length === 0 && !hasInstallationReport && (
          <Card className="mb-6 border-border/40">
            <View className="p-6 items-center">
              <Ionicons name="folder-open-outline" size={32} color={COLORS.neutral.gray[500]} />
              <Text className="text-sm text-muted-foreground mt-2">Belum ada dokumen</Text>
            </View>
          </Card>
        )}

        {/* PDF Section - Only show if installation report exists */}
        {hasInstallationReport && (
          <View className="mb-4">
            <Text weight="bold" className="text-base text-foreground mb-3 px-1">
              Laporan Instalasi (PDF)
            </Text>

            <Card className="border-border/40">
              <View className="p-4 gap-y-3">
                <View className="flex-row items-center gap-x-3">
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                    <Ionicons name="document-text" size={20} color={COLORS.brand.primary} />
                  </View>
                  <View className="flex-1">
                    <Text weight="semibold" className="text-sm text-foreground">
                      Laporan Instalasi
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      PDF report untuk {customerName}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-x-3">
                  <TouchableOpacity
                    onPress={handleViewPdf}
                    disabled={pdfLoading}
                    className={`flex-1 flex-row items-center justify-center gap-x-2 py-2.5 rounded-lg border border-primary ${pdfLoading ? "opacity-50" : ""}`}
                  >
                    <Ionicons name="eye-outline" size={16} color={COLORS.brand.primary} />
                    <Text weight="semibold" className="text-sm text-primary">
                      {pdfLoading ? "Memuat..." : "Lihat"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDownloadPdf}
                    disabled={pdfLoading}
                    className={`flex-1 flex-row items-center justify-center gap-x-2 py-2.5 rounded-lg bg-primary ${pdfLoading ? "opacity-50" : ""}`}
                  >
                    <Ionicons name="download-outline" size={16} color="#fff" />
                    <Text weight="semibold" className="text-sm text-white">
                      {pdfLoading ? "Memuat..." : "Download"}
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

/** Document thumbnail using expo-image */
function DocThumb({ uri }: { uri: string }) {
  return (
    <ExpoImage
      source={{ uri }}
      style={{ width: "100%", height: 112 }}
      contentFit="cover"
      cachePolicy="memory-disk"
    />
  );
}
