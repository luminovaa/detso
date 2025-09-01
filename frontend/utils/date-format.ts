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

  // ✅ PERBAIKAN: Gunakan toLocaleString dengan timezone yang benar
  const indonesiaTimeZones = {
    'WIB': 'Asia/Jakarta',
    'WITA': 'Asia/Makassar', 
    'WIT': 'Asia/Jayapura'
  };
  
  const locale = 'id-ID';
  const timeZoneStr = indonesiaTimeZones[timeZone];
  
  // Dapatkan tanggal dalam timezone Indonesia
  const indonesiaDate = new Date(dateObj.toLocaleString('en-US', { timeZone: timeZoneStr }));
  
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

  const dayName = days[indonesiaDate.getDay()];
  const dateNum = indonesiaDate.getDate();
  const month = shortMonth ? shortMonths[indonesiaDate.getMonth()] : months[indonesiaDate.getMonth()];
  const year = indonesiaDate.getFullYear();

  // Format dasar
  let formattedDate = '';
  if (includeDay) {
    formattedDate = `${dayName}, ${dateNum} ${month} ${year}`;
  } else {
    formattedDate = `${dateNum} ${month} ${year}`;
  }

  // Tambahkan waktu jika diperlukan
  if (includeTime) {
    const hours = indonesiaDate.getHours().toString().padStart(2, '0');
    const minutes = indonesiaDate.getMinutes().toString().padStart(2, '0');
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
 * ✅ PERBAIKAN: Konversi waktu ke zona waktu Indonesia yang benar
 * @param date - Tanggal yang akan dikonversi
 * @param timeZone - Zona waktu Indonesia (WIB, WITA, WIT)
 * @returns Date object dengan waktu Indonesia
 */
export const convertToIndonesiaTime = (
  date: Date | string, 
  timeZone: 'WIB' | 'WITA' | 'WIT' = 'WIB'
): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const indonesiaTimeZones = {
    'WIB': 'Asia/Jakarta',
    'WITA': 'Asia/Makassar', 
    'WIT': 'Asia/Jayapura'
  };
  
  const timeZoneStr = indonesiaTimeZones[timeZone];
  
  // Gunakan toLocaleString untuk konversi timezone yang benar
  const localTimeStr = dateObj.toLocaleString('en-US', { timeZone: timeZoneStr });
  return new Date(localTimeStr);
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
  const indonesiaTime = convertToIndonesiaTime(date, timeZone);
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

// ✅ FUNGSI TAMBAHAN: Untuk debugging timezone issues
export const debugTimezone = (date: Date | string, timeZone: 'WIB' | 'WITA' | 'WIT' = 'WIB') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  console.log('=== DEBUG TIMEZONE ===');
  console.log('Input date:', dateObj.toISOString());
  console.log('Input timezone:', timeZone);
  console.log('Local time:', dateObj.toString());
  console.log('Indonesia time:', convertToIndonesiaTime(dateObj, timeZone).toString());
  console.log('Formatted:', formatDate(dateObj, { includeTime: true, timeZone }));
  console.log('====================');
};

// Contoh penggunaan yang benar:
// const testDate = new Date('2024-08-31T14:00:00Z'); // UTC time
// console.log(formatDate(testDate, { includeTime: true, timeZone: 'WIB' })); 
// // Hasil: "Sabtu, 31 Agustus 2024 21:00 WIB" (UTC+7)

// Debug untuk melihat masalah:
// debugTimezone('2024-08-31T17:00:00Z', 'WIB');