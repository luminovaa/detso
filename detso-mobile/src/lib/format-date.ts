export const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "short",
        year: "numeric",
    };
    return date.toLocaleDateString("id-ID", options);
};

export const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // ✅ 24 jam
    });
};

export const formatDateTime = (date: Date) => {
    return `${formatDate(date)}, ${formatTime(date)}`;
};

/**
 * Format relative time (e.g., "2 hari yang lalu", "3 jam yang lalu")
 * Manual implementation untuk React Native
 */
export const formatRelativeTime = (date: Date | string, locale: string = "id") => {
    const now = new Date();
    const targetDate = typeof date === "string" ? new Date(date) : date;
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    // Translations
    const translations = {
        id: {
            justNow: "baru saja",
            secondsAgo: (n: number) => `${n} detik yang lalu`,
            minutesAgo: (n: number) => `${n} menit yang lalu`,
            hoursAgo: (n: number) => `${n} jam yang lalu`,
            daysAgo: (n: number) => `${n} hari yang lalu`,
            weeksAgo: (n: number) => `${n} minggu yang lalu`,
            monthsAgo: (n: number) => `${n} bulan yang lalu`,
            yearsAgo: (n: number) => `${n} tahun yang lalu`,
        },
        en: {
            justNow: "just now",
            secondsAgo: (n: number) => `${n} second${n > 1 ? 's' : ''} ago`,
            minutesAgo: (n: number) => `${n} minute${n > 1 ? 's' : ''} ago`,
            hoursAgo: (n: number) => `${n} hour${n > 1 ? 's' : ''} ago`,
            daysAgo: (n: number) => `${n} day${n > 1 ? 's' : ''} ago`,
            weeksAgo: (n: number) => `${n} week${n > 1 ? 's' : ''} ago`,
            monthsAgo: (n: number) => `${n} month${n > 1 ? 's' : ''} ago`,
            yearsAgo: (n: number) => `${n} year${n > 1 ? 's' : ''} ago`,
        },
    };

    const t = translations[locale as keyof typeof translations] || translations.en;

    // Calculate intervals
    const intervals = [
        { threshold: 31536000, format: t.yearsAgo },
        { threshold: 2592000, format: t.monthsAgo },
        { threshold: 604800, format: t.weeksAgo },
        { threshold: 86400, format: t.daysAgo },
        { threshold: 3600, format: t.hoursAgo },
        { threshold: 60, format: t.minutesAgo },
        { threshold: 10, format: t.secondsAgo },
    ];

    for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.threshold);
        if (count >= 1) {
            return interval.format(count);
        }
    }

    return t.justNow;
};
