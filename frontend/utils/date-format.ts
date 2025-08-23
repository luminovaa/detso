// utils/dateUtils.ts

interface DateFormatOptions {
  includeTime?: boolean;
  shortMonth?: boolean;
  includeDay?: boolean;
  timeZone?: 'WIB' | 'WITA' | 'WIT'; // Zona waktu Indonesia
}

/**
 * Format tanggal ke bahasa Indonesia
 * @param date - Tanggal yang akan diformat (bisa Date object atau string)
 * @param options - Opsi format tambahan
 * @returns Tanggal yang sudah diformat
 */
export const formatDate = (
  date: Date | string, 
  options: DateFormatOptions = {}
): string => {
  const { 
    includeTime = false, 
    shortMonth = false, 
    includeDay = true,
    timeZone = 'WIB'
  } = options;
  
  // Handle jika date adalah string
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Validasi Date object
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return 'Tanggal tidak valid';
  }

  // Konversi ke waktu Indonesia berdasarkan zona waktu
  const indonesiaTime = convertToIndonesiaTime(dateObj, timeZone);
  
  // Nama hari dalam bahasa Indonesia
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
  // Nama bulan dalam bahasa Indonesia
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const dayName = days[indonesiaTime.getDay()];
  const dateNum = indonesiaTime.getDate();
  const month = shortMonth ? shortMonths[indonesiaTime.getMonth()] : months[indonesiaTime.getMonth()];
  const year = indonesiaTime.getFullYear();

  // Format dasar
  let formattedDate = '';
  if (includeDay) {
    formattedDate = `${dayName}, ${dateNum} ${month} ${year}`;
  } else {
    formattedDate = `${dateNum} ${month} ${year}`;
  }

  // Tambahkan waktu jika diperlukan
  if (includeTime) {
    const hours = indonesiaTime.getHours().toString().padStart(2, '0');
    const minutes = indonesiaTime.getMinutes().toString().padStart(2, '0');
    formattedDate += ` ${hours}:${minutes} ${timeZone}`;
  }

  return formattedDate;
};

/**
 * Format relatif (time ago) dalam bahasa Indonesia
 * @param date - Tanggal yang akan diformat
 * @returns Waktu relatif (contoh: "2 hari yang lalu")
 */
export const timeAgo = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  const intervals = {
    tahun: 31536000,
    bulan: 2592000,
    minggu: 604800,
    hari: 86400,
    jam: 3600,
    menit: 60,
    detik: 1
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit} yang lalu`;
    }
  }
  
  return 'Baru saja';
};

/**
 * Konversi waktu ke zona waktu Indonesia
 * @param date - Tanggal yang akan dikonversi
 * @param timeZone - Zona waktu Indonesia (WIB, WITA, WIT)
 * @returns Date object dengan waktu Indonesia
 */
export const convertToIndonesiaTime = (
  date: Date | string, 
  timeZone: 'WIB' | 'WITA' | 'WIT' = 'WIB'
): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Offset waktu Indonesia dari UTC (dalam milidetik)
  const timeZoneOffsets = {
    'WIB': 7 * 60 * 60 * 1000, // UTC+7
    'WITA': 8 * 60 * 60 * 1000, // UTC+8
    'WIT': 9 * 60 * 60 * 1000  // UTC+9
  };
  
  const offset = timeZoneOffsets[timeZone];
  return new Date(dateObj.getTime() + offset);
};

/**
 * Mendapatkan waktu Indonesia saat ini
 * @param timeZone - Zona waktu Indonesia (WIB, WITA, WIT)
 * @returns Date object dengan waktu Indonesia saat ini
 */
export const getCurrentIndonesiaTime = (
  timeZone: 'WIB' | 'WITA' | 'WIT' = 'WIB'
): Date => {
  return convertToIndonesiaTime(new Date(), timeZone);
};

/**
 * Format jam Indonesia (HH:MM)
 * @param date - Tanggal yang akan diformat
 * @param timeZone - Zona waktu Indonesia
 * @returns String jam dalam format HH:MM
 */
export const formatIndonesiaTime = (
  date: Date | string, 
  timeZone: 'WIB' | 'WITA' | 'WIT' = 'WIB'
): string => {
  const indonesiaTime = new Date(date);
  const hours = indonesiaTime.getHours().toString().padStart(2, '0');
  const minutes = indonesiaTime.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes} ${timeZone}`;
};

/**
 * Cek apakah waktu termasuk dalam jam kerja Indonesia (08:00-17:00)
 * @param date - Tanggal yang akan dicek
 * @param timeZone - Zona waktu Indonesia
 * @returns Boolean apakah termasuk jam kerja
 */
export const isWorkingHours = (
  date: Date | string, 
  timeZone: 'WIB' | 'WITA' | 'WIT' = 'WIB'
): boolean => {
  const indonesiaTime = convertToIndonesiaTime(date, timeZone);
  const hours = indonesiaTime.getHours();
  const day = indonesiaTime.getDay(); // 0 = Minggu, 1-6 = Senin-Sabtu
  
  // Cek bukan hari Minggu dan jam antara 08:00-17:00
  return day !== 0 && hours >= 8 && hours < 17;
};

// Contoh penggunaan:
// console.log(formatDate(new Date())); // "Senin, 12 Maret 2023"
// console.log(formatDate('2023-03-12T14:30:00', { includeTime: true, timeZone: 'WITA' })); // "Senin, 12 Maret 2023 14:30 WITA"
// console.log(timeAgo(new Date(Date.now() - 3600000))); // "1 jam yang lalu"
// console.log(getCurrentIndonesiaTime('WIT')); // Date object dengan waktu WIT saat ini
// console.log(formatIndonesiaTime(new Date(), 'WIB')); // "14:30 WIB"
// console.log(isWorkingHours(new Date())); // true/false