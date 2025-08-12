export const parseCurrency = (value: string): number => {
  // Hapus semua karakter non-digit kecuali titik (untuk desimal)
  const numberString = value.replace(/[^\d]/g, '');
  const num = parseFloat(numberString);
  return isNaN(num) ? 0 : num;
};

export const formatCurrency = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d]/g, '')) : value;
  if (isNaN(num)) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace(/^Rp\s?/, 'Rp ');
};