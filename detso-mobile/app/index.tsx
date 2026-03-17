import React, { useState } from "react";
import { View, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Import komponen UI yang sudah kita racik!
import { Text } from "@/src/components/global/text";
import { Button } from "@/src/components/global/button";
import { ImagePickerSheet } from "@/src/components/global/image-picker";

export default function TestKameraScreen() {
  // 1. State untuk mengontrol muncul/hilangnya Bottom Sheet Image Picker
  const [isPickerVisible, setPickerVisible] = useState(false);

  // 2. State untuk menyimpan hasil jepretan/pilihan galeri
  const [fotoBukti, setFotoBukti] = useState<{
    uri: string;
    base64?: string;
  } | null>(null);

  // 3. Fungsi saat foto selesai dipilih & dikompresi
  const handleImageSelected = (uri: string, base64?: string) => {
    setFotoBukti({ uri, base64 });
    // Di dunia nyata, base64 ini yang akan dikirim ke API backend-mu
  };

  // 4. Fungsi submit bohongan
  const handleSubmit = () => {
    if (!fotoBukti) {
      Alert.alert(
        "Error",
        "Harap lampirkan foto bukti pekerjaan terlebih dahulu!",
      );
      return;
    }

    // Tampilkan notifikasi sukses (hanya menampilkan 50 karakter pertama base64 agar alert tidak hang)
    Alert.alert(
      "Berhasil Dikirim! 📤",
      `URI: ${fotoBukti.uri}\n\nBase64 siap dikirim: ${fotoBukti.base64 ? fotoBukti.base64.substring(0, 50) + "..." : "Tidak ada"}`,
    );
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-6 pt-16">
        {/* --- HEADER --- */}
        <View className="mb-8">
          <Text weight="bold" className="text-3xl text-foreground">
            Bukti Pekerjaan
          </Text>
          <Text className="text-muted-foreground mt-2 text-base leading-relaxed">
            Silakan ambil foto hasil pengukuran OPM atau kondisi perangkat
            sebelum meninggalkan lokasi.
          </Text>
        </View>

        {/* --- AREA UPLOAD FOTO --- */}
        <View className="mb-10">
          <Text weight="semibold" className="text-foreground mb-3 text-lg">
            Lampiran Foto <Text className="text-destructive">*</Text>
          </Text>

          {fotoBukti ? (
            /* JIKA FOTO SUDAH ADA: Tampilkan preview dan tombol hapus */
            <View className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden border border-border shadow-sm">
              <Image
                source={{ uri: fotoBukti.uri }}
                className="w-full h-full"
                resizeMode="cover"
              />

              {/* Tombol Silang (Hapus) */}
              <TouchableOpacity
                onPress={() => setFotoBukti(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/60 rounded-full justify-center items-center backdrop-blur-md border border-white/20"
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={20} color="#ff6b6b" />
              </TouchableOpacity>

              {/* Label "Sudah Distempel GPS" (Bohongan untuk UI) */}
              <View className="absolute bottom-4 left-4 bg-emerald-500/90 px-3 py-1.5 rounded-full flex-row items-center border border-emerald-400">
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="white"
                  className="mr-1.5"
                />
                <Text weight="bold" className="text-white text-xs">
                  GeoTag Aktif
                </Text>
              </View>
            </View>
          ) : (
            /* JIKA FOTO BELUM ADA: Tampilkan kotak placeholder putus-putus */
            <TouchableOpacity
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7}
              className="w-full aspect-[3/4] rounded-3xl border-2 border-dashed border-border bg-muted/50 justify-center items-center"
            >
              <View className="bg-primary/10 w-16 h-16 rounded-full items-center justify-center mb-4">
                <Ionicons name="camera" size={32} color="var(--primary)" />
              </View>
              <Text weight="bold" className="text-foreground text-lg mb-1">
                Tambah Foto
              </Text>
              <Text className="text-muted-foreground text-sm">
                Ketuk untuk membuka kamera
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* --- TOMBOL SUBMIT --- */}
        <Button
          title="Kirim Laporan"
          variant="primary"
          onPress={handleSubmit}
          className="mb-10" // Beri ruang kosong di bawah agar bisa di-scroll
        />
      </ScrollView>

      {/* ========================================== */}
      {/* 5. PEMANGGILAN KOMPONEN IMAGE PICKER SHEET  */}
      {/* ========================================== */}
      <ImagePickerSheet
        visible={isPickerVisible}
        onClose={() => setPickerVisible(false)}
        onImageSelected={handleImageSelected}
        aspectRatio="3:4" // Resolusi potrait, sangat cocok untuk memfoto tiang/kabel
        enableGeoTag={true} // 🔥 NYALAKAN FITUR GPS WATERMARK!
        quality={0.8} // Kualitas gambar lumayan tinggi
      />
    </View>
  );
}
