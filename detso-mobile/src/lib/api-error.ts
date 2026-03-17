import { AxiosError } from "axios";

export function getErrorMessage(error: unknown): string {
    // 1. Jika error berasal dari Axios (Backend)
    if (error instanceof AxiosError) {
        if (error.response) {
            // Server merespons dengan status di luar 2xx (400, 401, 403, 404, 500)
            const data = error.response.data;

            // Sesuaikan dengan format respons JSON dari backend Node.js/Laravel kamu
            if (data?.message) return data.message;
            if (data?.error) return data.error;

            return `Kesalahan Server (${error.response.status})`;
        } else if (error.request) {
            // Request terkirim tapi tidak ada balasan (Masalah jaringan/Backend mati)
            return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
        } else {
            // Terjadi kesalahan saat men-setup request Axios
            return error.message;
        }
    }

    // 2. Jika error bawaan JavaScript (Error biasa)
    if (error instanceof Error) {
        return error.message;
    }

    // 3. Fallback jika format error tidak dikenali
    return "Terjadi kesalahan yang tidak terduga.";
}