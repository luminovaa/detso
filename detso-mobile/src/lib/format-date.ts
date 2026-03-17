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
