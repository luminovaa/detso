import React, { useMemo } from "react";
import { Text } from "./text";

export interface HighlightedTextProps {
  text: string;
  searchQuery: string;
  className?: string;
  highlightClassName?: string;
  numberOfLines?: number;
}

/**
 * Component untuk menampilkan text dengan highlight pada kata yang dicari
 * @param text - Text yang akan ditampilkan
 * @param searchQuery - Kata kunci pencarian yang akan di-highlight
 * @param className - Class untuk text normal
 * @param highlightClassName - Class untuk text yang di-highlight
 * @param numberOfLines - Jumlah baris maksimal
 */
export const HighlightedText = React.memo(function HighlightedText({
  text,
  searchQuery,
  className = "text-base text-foreground",
  highlightClassName = "text-primary bg-primary/10",
  numberOfLines,
}: HighlightedTextProps) {
  // Memoize regex creation — expensive operation yang tidak perlu diulang tiap render
  const regex = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return null;
    const searchWords = trimmed.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(`(${searchWords.join("|")})`, "gi");
  }, [searchQuery]);

  // Memoize parts splitting
  const parts = useMemo(() => {
    if (!regex) return null;
    return text.split(regex);
  }, [text, regex]);

  // Jika tidak ada search query, tampilkan text biasa
  if (!regex || !parts) {
    return (
      <Text className={className} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  return (
    <Text className={className} numberOfLines={numberOfLines}>
      {parts.map((part, index) => {
        // Cek apakah part ini match dengan search query
        const isHighlighted = regex.test(part);
        
        // Reset regex lastIndex untuk test berikutnya
        regex.lastIndex = 0;

        return isHighlighted ? (
          <Text key={index} weight="bold" className={highlightClassName}>
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        );
      })}
    </Text>
  );
});

/**
 * Utility function untuk highlight text (tanpa component)
 * Berguna jika ingin custom rendering sendiri
 */
export const highlightText = (text: string, searchQuery: string) => {
  if (!searchQuery.trim()) {
    return [{ text, highlighted: false }];
  }

  const searchWords = searchQuery.trim().split(/\s+/);
  const regex = new RegExp(`(${searchWords.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part) => {
    const isHighlighted = regex.test(part);
    regex.lastIndex = 0;
    return { text: part, highlighted: isHighlighted };
  });
};
