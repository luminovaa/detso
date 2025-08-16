// utils/dateUtils.ts

interface DateFormatOptions {
  includeTime?: boolean;
  shortMonth?: boolean;
  includeDay?: boolean;
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
    includeDay = true 
  } = options;
  
  // Handle jika date adalah string
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Validasi Date object
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return 'Tanggal tidak valid';
  }

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

  const dayName = days[dateObj.getDay()];
  const dateNum = dateObj.getDate();
  const month = shortMonth ? shortMonths[dateObj.getMonth()] : months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  // Format dasar
  let formattedDate = '';
  if (includeDay) {
    formattedDate = `${dayName}, ${dateNum} ${month} ${year}`;
  } else {
    formattedDate = `${dateNum} ${month} ${year}`;
  }

  // Tambahkan waktu jika diperlukan
  if (includeTime) {
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    formattedDate += ` ${hours}:${minutes}`;
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

// Contoh penggunaan:
// console.log(formatDate(new Date())); // "Senin, 12 Maret 2023"
// console.log(formatDate('2023-03-12T14:30:00', { includeTime: true })); // "Senin, 12 Maret 2023 14:30"
// console.log(timeAgo(new Date(Date.now() - 3600000))); // "1 jam yang lalu"