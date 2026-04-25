import React from "react";
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
export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  searchQuery,
  className = "text-base text-foreground",
  highlightClassName = "text-primary bg-primary/10",
  numberOfLines,
}) => {
  // Jika tidak ada search query, tampilkan text biasa
  if (!searchQuery.trim()) {
    return (
      <Text className={className} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  // Buat regex untuk mencari kata yang match (case insensitive)
  // Split search query untuk support multiple words
  const searchWords = searchQuery.trim().split(/\s+/);
  const regex = new RegExp(`(${searchWords.join("|")})`, "gi");
  
  // Split text berdasarkan regex
  const parts = text.split(regex);

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
};

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
