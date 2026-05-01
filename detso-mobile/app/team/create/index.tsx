import React, { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// --- Global Components ---
import { ScreenWrapper } from "@/src/components/global/screen-wrapper";
import { Text } from "@/src/components/global/text";
import { Button } from "@/src/components/global/button";
import { FormInput } from "@/src/components/global/form-input";
import { Label } from "@/src/components/global/label";

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
      description: "Manage team & data",
    },
    {
      value: Detso_Role.TENANT_TEKNISI,
      label: t("team.roleTechnician"),
      icon: "construct",
      description: "Field operations",
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
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
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
              <Label>{t("team.roleLabel")}</Label>
              <View className="flex-row gap-x-3 mt-1">
                {roleOptions.map((option) => {
                  const isActive = selectedRole === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setSelectedRole(option.value)}
                      style={[
                        styles.roleCard,
                        isActive && styles.roleCardActive,
                      ]}
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
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View className="px-4 py-3 border-t border-border/10 bg-background">
          <Button
            title={isSubmitting ? t("team.creating") : t("team.submitBtn")}
            size="lg"
            className="w-full shadow-lg shadow-primary/20"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  roleCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  roleCardActive: {
    borderColor: "hsl(221.2, 83.2%, 53.3%)",
    backgroundColor: "hsl(221.2, 83.2%, 96%)",
  },
});
