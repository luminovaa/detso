import React, { useState } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "@/src/components/global/text";
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Avatar } from "@/src/components/global/avatar";
import { FormInput } from "@/src/components/global/form-input";
import { Button } from "@/src/components/global/button";
import { ImagePickerSheet } from "@/src/components/global/image-picker";
import { showToast } from "@/src/components/global/toast";
import { FormSkeleton } from "@/src/components/global/form-skeleton";

import { useAuthStore } from "@/src/features/auth/store";
import { useT } from "@/src/features/i18n/store";
import { userService } from "@/src/features/user/service";
import { updateUserSchema, UpdateUserInput } from "@/src/features/user/schema";
import { useMutation } from "@/src/hooks/use-async";

export default function EditProfileScreen() {
  const { t } = useT();
  const { user, refreshUserData } = useAuthStore();
  
  const { mutate, isLoading: isSubmitting } = useMutation();
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64?: string } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      full_name: user?.profile?.full_name || "",
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  // Sync form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        full_name: user.profile?.full_name || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      // Set delay untuk skeleton effect
      setTimeout(() => setIsInitializing(false), 500);
    }
  }, [user, reset]);

  const onImageSelected = (uri: string, base64?: string) => {
    setSelectedImage({ uri, base64 });
    setShowImagePicker(false);
  };

    const onSubmit = async (data: UpdateUserInput) => {
    if (!user?.id) return;
    
    const formData = new FormData();
    
    // Append fields
    if (data.full_name) formData.append("full_name", data.full_name);
    if (data.username) formData.append("username", data.username);
    if (data.email) formData.append("email", data.email);
    if (data.phone) formData.append("phone", data.phone);
    
    // Append image if selected
    if (selectedImage) {
      const fileUri = selectedImage.uri;
      const uriParts = fileUri.split(".");
      const fileType = uriParts[uriParts.length - 1];

      formData.append("avatar", {
        uri: fileUri,
        name: `avatar-${user.id}.${fileType}`,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
      } as any);
    }

    await mutate(
      async () => {
        await userService.update(user.id, formData);
        await refreshUserData();
      },
      {
        onSuccess: () => {
          showToast.success("Profil Diperbarui", "Data profil Anda berhasil disimpan.");
        },
        toastTitle: "Gagal",
      },
    );
  };

  if (isInitializing) {
    return (
      <ScreenWrapper 
        headerTitle="Edit Profil" 
        showBackButton
        isLoading={true}
      >
        <FormSkeleton 
          fieldCount={4} 
          showAvatar={true} 
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper headerTitle="Edit Profil" showBackButton>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* --- PROFILE PICTURE SECTION --- */}
        <View className="items-center mt-6 mb-10">
          <View className="relative">
            <Avatar 
              src={selectedImage?.uri || user?.profile?.avatar} 
              alt={user?.profile?.full_name || user?.username}
              size="2xl"
              className="border-4 border-background shadow-sm"
            />
            
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setShowImagePicker(true)}
              className="absolute bottom-0 right-0 bg-primary w-10 h-10 rounded-full items-center justify-center border-4 border-background shadow-lg"
            >
              <Ionicons name="camera" size={18} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-muted-foreground mt-4 text-sm font-medium">
            Ketuk ikon kamera untuk mengganti foto
          </Text>
        </View>

        {/* --- FORM SECTION --- */}
        <View className="px-1">
          <FormInput
            control={control}
            name="full_name"
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap Anda"
          />
          
          <FormInput
            control={control}
            name="username"
            label="Username"
            placeholder="Masukkan username"
            autoCapitalize="none"
          />
          
          <FormInput
            control={control}
            name="email"
            label="Alamat Email"
            placeholder="nama@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <FormInput
            control={control}
            name="phone"
            label="Nomor Telepon"
            placeholder="08xxxxxxxx"
            keyboardType="phone-pad"
          />
        </View>

        <View className="mt-10">
          <Button 
            title={isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            size="lg"
            className="w-full shadow-lg shadow-primary/20"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting || (!isDirty && !selectedImage)}
          />
          
          <Text className="text-center text-muted-foreground text-xs mt-4 px-6 leading-relaxed">
            Pastikan data yang Anda masukkan sudah benar sebelum menekan tombol simpan.
          </Text>
        </View>
      </ScrollView>

      {/* --- MODALS --- */}
      <ImagePickerSheet 
        visible={showImagePicker} 
        onClose={() => setShowImagePicker(false)}
        onImageSelected={onImageSelected}
        aspectRatio="1:1"
      />
    </ScreenWrapper>
  );
}
