import React, { useState } from "react";
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Button } from "@/src/components/global/button";
import { Card } from "@/src/components/global/card";
import { FormInput } from "@/src/components/global/form-input";

// --- State & Logic ---
import { useT } from "@/src/features/i18n/store";
import { createUserSchema, CreateUserInput, Detso_Role } from "@/src/features/auth/schema";
import { useCreateUser } from "@/src/features/user/hooks";

type RoleOption = {
  value: typeof Detso_Role.TENANT_ADMIN | typeof Detso_Role.TENANT_TEKNISI;
  label: string;
  icon: string;
  description: string;
};

export default function TeamCreateScreen() {
  const { t } = useT();
  const createUser = useCreateUser();
  const isSubmitting = createUser.isPending;

  const [selectedRole, setSelectedRole] = useState<string>(Detso_Role.TENANT_TEKNISI);

  const { control, handleSubmit } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema) as any,
    defaultValues: {
      full_name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      role: Detso_Role.TENANT_TEKNISI,
    },
  });

  const roleOptions: RoleOption[] = [
    {
      value: Detso_Role.TENANT_ADMIN,
      label: t("team.roleAdmin"),
      icon: "shield",
      description: t("team.roleAdminDesc"),
    },
    {
      value: Detso_Role.TENANT_TEKNISI,
      label: t("team.roleTechnician"),
      icon: "construct",
      description: t("team.roleTechnicianDesc"),
    },
  ];

  const onSubmit = (data: CreateUserInput) => {
    const payload = { ...data, role: selectedRole as any };
    createUser.mutate(payload, {
      onSuccess: () => router.back(),
    });
  };

  return (
    <ScreenWrapper headerTitle={t("team.createTitle")} showBackButton>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card className="rounded-2xl p-4 mb-4">
            <Text weight="bold" className="text-base text-foreground mb-3">
              {t("team.detailTitle")}
            </Text>
            <View className="gap-y-3">
              <FormInput
                control={control}
                name="full_name"
                label={t("team.fullNameLabel")}
                placeholder={t("team.fullNamePlaceholder")}
              />

              <FormInput
                control={control}
                name="username"
                label={t("team.usernameLabel")}
                placeholder={t("team.usernamePlaceholder")}
                autoCapitalize="none"
              />

              <FormInput
                control={control}
                name="email"
                label={t("team.emailLabel")}
                placeholder={t("team.emailPlaceholder")}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <FormInput
                control={control}
                name="phone"
                label={t("team.phoneLabel")}
                placeholder={t("team.phonePlaceholder")}
                keyboardType="phone-pad"
              />

              <FormInput
                control={control}
                name="password"
                label={t("team.passwordLabel")}
                placeholder={t("team.passwordPlaceholder")}
                isPassword
              />

              {/* Role Selector */}
              <View className="mb-2">
                <Text weight="medium" className="text-sm text-muted-foreground mb-1.5">
                  {t("team.roleLabel")}
                </Text>
                <View className="flex-row gap-x-3 mt-1">
                  {roleOptions.map((option) => {
                    const isActive = selectedRole === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setSelectedRole(option.value)}
                        className={`flex-1 min-h-11 py-3 px-3.5 rounded-xl border items-center justify-center ${
                          isActive
                            ? "bg-primary/10 border-primary"
                            : "bg-muted/20 border-border"
                        }`}
                      >
                        <Text
                          weight={isActive ? "bold" : "medium"}
                          className={isActive ? "text-primary text-sm" : "text-foreground text-sm"}
                        >
                          {option.label}
                        </Text>
                        <Text className="text-[10px] text-muted-foreground mt-0.5">
                          {option.description}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </Card>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View
          className="pt-3 pb-2 border-t border-border/10 bg-background"
        >
          <Button
            title={isSubmitting ? t("team.creating") : t("team.submitBtn")}
            size="lg"
            className="w-full shadow-lg shadow-primary/20"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}


