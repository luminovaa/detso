/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback, useRef } from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import _debounce from "lodash.debounce";

// --- IMPORT GORHOM BOTTOM SHEET ---
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";

import { cn } from "../../lib/utils";
import { Text } from "./text";
import { Label } from "./label";
import { BottomSheet } from "./bottom-sheet"; // Import Bottom Sheet kustom kita!

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
    return <Text className="text-base text-foreground">{text}</Text>;
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
  placeholder = "Pilih opsi...",
  fetchOptions,
  initialLabel = "",
  highlightSearch = false,
  onSelectFullObject,
}: AsyncSelectProps<T>) => {
  // 1. Ganti State Modal dengan Ref BottomSheet
  const bottomSheetRef = useRef<BottomSheetModal>(null);

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

  // 2. Buka Laci
  const handleOpenSheet = () => {
    bottomSheetRef.current?.present();
    if (options.length === 0) {
      loadOptions(1, "", true);
    }
  };

  // 3. Tutup Laci
  const handleCloseSheet = () => {
    bottomSheetRef.current?.dismiss();
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
      rules={{ required: required ? `${label} wajib diisi` : false }}
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
            onPress={handleOpenSheet} // Panggil fungsi buka laci
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
              {selectedDisplayLabel || placeholder}
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

          {/* === DROPDOWN BOTTOM SHEET === */}
          <BottomSheet
            ref={bottomSheetRef}
            snapPoints={["85%", "95%"]} // Biarkan tinggi agar enak buat nyari data
            enableScroll={false} // Matikan scroll container utama agar FlatList bisa scrolling
          >
            {/* Header Laci */}
            <View className="flex-row items-center justify-between pb-4 border-b border-border">
              <Text weight="bold" className="text-xl text-foreground">
                Pilih {label}
              </Text>
              <TouchableOpacity
                onPress={handleCloseSheet}
                className="h-10 w-10 items-center justify-center bg-muted rounded-full"
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Input Pencarian */}
            <View className="py-4 border-b border-border/50">
              <View className="flex-row items-center bg-background border border-input rounded-2xl px-4 h-14">
                <Ionicons
                  name="search-outline"
                  size={20}
                  color="#94a3b8"
                  className="mr-3"
                />

                {/* Wajib pakai BottomSheetTextInput agar gesture tidak bentrok! */}
                <BottomSheetTextInput
                  style={{ flex: 1, fontSize: 16, color: "var(--foreground)" }} // Styling manual karena className sering bug di komponen Gorhom
                  placeholder="Cari data..."
                  placeholderTextColor="#94a3b8"
                  value={search}
                  onChangeText={handleSearchChange}
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
            <BottomSheetFlatList
              data={options}
              keyExtractor={(item: SelectOption) => item.value}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
              renderItem={({ item }: { item: SelectOption }) => (
                <TouchableOpacity
                  onPress={() => {
                    onChange(item.value);
                    setSelectedDisplayLabel(item.label);
                    handleCloseSheet(); // Tutup saat dipilih

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
              // ... (ListEmptyComponent & ListFooterComponent sama persis seperti sebelumnya)
              ListEmptyComponent={() => (
                <View className="py-16 items-center justify-center">
                  {isLoading ? (
                    <View className="items-center">
                      <View className="bg-primary/10 w-14 h-14 rounded-full items-center justify-center mb-4">
                        <ActivityIndicator size="small" color="#1d4ed8" />
                      </View>
                      <Text className="text-muted-foreground">
                        Memuat data...
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
                          ? `Tidak ada hasil untuk "${search}"`
                          : "Tidak ada data tersedia"}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() => {
                if (isFetchingMore)
                  return (
                    <ActivityIndicator
                      className="py-6"
                      size="small"
                      color="#1d4ed8"
                    />
                  );
                if (!hasNextPage && options.length > 0) {
                  return (
                    <View className="py-6 items-center">
                      <View className="h-[2px] w-16 bg-border mb-3 rounded-full" />
                      <Text className="text-muted-foreground text-xs">
                        Semua data ditampilkan
                      </Text>
                    </View>
                  );
                }
                return null;
              }}
              refreshing={isLoading && page === 1}
              onRefresh={() => loadOptions(1, searchRef.current, true)}
            />
          </BottomSheet>
        </View>
      )}
    />
  );
};
