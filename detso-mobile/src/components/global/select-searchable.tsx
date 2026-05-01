/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import _debounce from "lodash.debounce";

import { cn } from "../../lib/utils";
import { Text } from "./text";
import { Label } from "./label";
import { useT } from "@/src/features/i18n/store";

export interface SelectOption {
  label: string;
  value: string;
  [key: string]: any;
}

interface AsyncSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  fetchOptions: (
    search: string,
    page: number,
  ) => Promise<{ data: SelectOption[]; hasNextPage: boolean }>;
  initialLabel?: string;
  highlightSearch?: boolean;
  onSelectFullObject?: (item: SelectOption) => void;
}

const HighlightText = ({ text, search }: { text: string; search: string }) => {
  if (!search.trim()) {
    return <Text className="text-base text-foreground flex-1" numberOfLines={1}>{text}</Text>;
  }

  const regex = new RegExp(`(${search.trim().split(/\s+/).join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <Text className="text-base text-foreground flex-1" numberOfLines={1}>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <Text
            key={index}
            weight="bold"
            className="text-primary bg-primary/10"
          >
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        ),
      )}
    </Text>
  );
};

export const AsyncSelect = <T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  placeholder,
  fetchOptions,
  initialLabel = "",
  highlightSearch = false,
  onSelectFullObject,
}: AsyncSelectProps<T>) => {
  const { t } = useT();
  const resolvedPlaceholder = placeholder || t("components.select.placeholder");
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<SelectOption[]>([]);

  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [selectedDisplayLabel, setSelectedDisplayLabel] =
    useState(initialLabel);
  const searchRef = useRef("");

  const loadOptions = async (
    pageNum: number,
    searchQuery: string,
    isRefresh = false,
  ) => {
    try {
      if (isRefresh) setIsLoading(true);
      else setIsFetchingMore(true);

      const response = await fetchOptions(searchQuery, pageNum);

      setOptions((prev) => {
        if (isRefresh) return response.data;

        const existingIds = new Set(prev.map((item) => item.value));
        const newUniqueData = response.data.filter(
          (item) => !existingIds.has(item.value),
        );
        return [...prev, ...newUniqueData];
      });

      setHasNextPage(response.hasNextPage);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to load options:", error);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  const debouncedSearch = useCallback(
    _debounce((query: string) => {
      loadOptions(1, query, true);
    }, 500),
    [],
  );

  const handleSearchChange = (text: string) => {
    setSearch(text);
    searchRef.current = text;
    debouncedSearch(text);
  };

  const handleOpenModal = () => {
    setModalVisible(true);
    if (options.length === 0) {
      // Load 2 pages initially to ensure list is scrollable
      loadOptions(1, "", true).then(() => {
        loadOptions(2, "", false);
      });
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingMore && !isLoading) {
      loadOptions(page + 1, searchRef.current, false);
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      rules={{ required: required ? t("components.select.required", { label }) : false }}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View className="mb-4">
          <Label>
            {label} {required && <Text className="text-destructive">*</Text>}
          </Label>

          {hint && (
            <Text className="text-muted-foreground text-xs mb-2 ml-1">
              {hint}
            </Text>
          )}

          {/* TRIGGER DROPDOWN BUTTON */}
          <TouchableOpacity
            onPress={handleOpenModal}
            activeOpacity={0.85}
            className={cn(
              "flex-row items-center justify-between bg-background h-14 px-4 rounded-2xl border transition-colors mt-2",
              error ? "border-destructive bg-destructive/5" : "border-input",
            )}
          >
            <Text
              className={cn(
                "flex-1 text-base",
                !value ? "text-muted-foreground" : "text-foreground",
              )}
              numberOfLines={1}
            >
              {selectedDisplayLabel || resolvedPlaceholder}
            </Text>
            <Ionicons
              name="chevron-down-outline"
              size={20}
              color={error ? "#ef4444" : "#64748b"}
            />
          </TouchableOpacity>

          {error && (
            <Text className="text-destructive text-xs ml-1 mt-1 font-medium">
              {error.message}
            </Text>
          )}

          {/* === DROPDOWN MODAL === */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleCloseModal}
            statusBarTranslucent
          >
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-card h-[80%] rounded-t-[32px] overflow-hidden">
                {/* Modal Header */}
                <View className="flex-row items-center justify-between px-6 pt-5 pb-4 border-b border-border">
                  <Text weight="bold" className="text-xl text-foreground">
                    {t("components.select.modalTitle", { label })}
                  </Text>
                  <TouchableOpacity
                    onPress={handleCloseModal}
                    className="h-9 w-9 items-center justify-center bg-muted rounded-full"
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Search Input */}
                <View className="px-6 py-4 border-b border-border/50">
                  <View className="flex-row items-center bg-background border border-input rounded-2xl px-4 h-14">
                    <Ionicons
                      name="search-outline"
                      size={20}
                      color="#94a3b8"
                    />
                    <TextInput
                      className="flex-1 text-base text-foreground ml-3"
                      placeholder={t("components.select.searchPlaceholder")}
                      placeholderTextColor="#94a3b8"
                      value={search}
                      onChangeText={handleSearchChange}
                      autoFocus
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                    {search.length > 0 && (
                      <TouchableOpacity
                        onPress={() => handleSearchChange("")}
                        activeOpacity={0.7}
                        className="ml-2 p-1"
                      >
                        <Ionicons name="close-circle" size={20} color="#94a3b8" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* List Data */}
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
                  style={{ flex: 1 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        onChange(item.value);
                        setSelectedDisplayLabel(item.label);
                        handleCloseModal();

                        if (onSelectFullObject) {
                          onSelectFullObject(item);
                        }
                      }}
                      activeOpacity={0.7}
                      className={cn(
                        "flex-row items-center justify-between p-4 rounded-2xl mb-2 border",
                        item.value === value
                          ? "bg-primary/10 border-primary/30"
                          : "bg-background border-border/50",
                      )}
                    >
                      {highlightSearch ? (
                        <HighlightText text={item.label} search={search} />
                      ) : (
                        <Text
                          weight={item.value === value ? "bold" : "regular"}
                          className={cn(
                            "text-base flex-1",
                            item.value === value
                              ? "text-primary"
                              : "text-foreground",
                          )}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      )}

                      {item.value === value && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#1d4ed8"
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={() => (
                    <View className="py-16 items-center justify-center">
                      {isLoading ? (
                        <View className="items-center">
                          <View className="bg-primary/10 w-14 h-14 rounded-full items-center justify-center mb-4">
                            <ActivityIndicator size="small" color="#1d4ed8" />
                          </View>
                          <Text className="text-muted-foreground">
                            {t("components.select.loading")}
                          </Text>
                        </View>
                      ) : (
                        <View className="items-center">
                          <View className="bg-muted w-16 h-16 rounded-full items-center justify-center mb-4">
                            <Ionicons
                              name="cube-outline"
                              size={32}
                              color="#94a3b8"
                            />
                          </View>
                          <Text className="text-muted-foreground text-center px-8">
                            {search
                              ? t("components.select.noResults", { search })
                              : t("components.select.empty")}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={() => {
                    if (isFetchingMore) {
                      return (
                        <View className="py-6 items-center">
                          <ActivityIndicator size="small" color="#1d4ed8" />
                          <Text className="text-muted-foreground text-xs mt-2">
                            {t("components.select.loadingMore")}
                          </Text>
                        </View>
                      );
                    }
                    if (!hasNextPage && options.length > 0) {
                      return (
                        <View className="py-4 items-center">
                          <View className="h-[2px] w-16 bg-border mb-2 rounded-full" />
                          <Text className="text-muted-foreground text-xs">
                            {t("components.select.allShown")}
                          </Text>
                        </View>
                      );
                    }
                    return null;
                  }}
                  refreshing={isLoading && page === 1}
                  onRefresh={() => loadOptions(1, searchRef.current, true)}
                />
              </View>
            </View>
          </Modal>
        </View>
      )}
    />
  );
};
