"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md w-full">
        <div className="bg-card border rounded-2xl p-8 shadow-light dark:shadow-dark">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/20 text-destructive rounded-full mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4.7c-.77-1.333-2.694-1.333-3.464 0L3.34 16.7c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">404</h1>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Halaman Tidak Ditemukan
            </h2>
            <p className="text-muted-foreground mb-6">
              Maaf, halaman yang Anda cari tidak tersedia atau mungkin sudah
              dipindahkan.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 rounded-3xl py-3 px-4 font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </Button>

            <Link href="/" className="flex-1">
              <Button className="w-full rounded-3xl py-3 px-4 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                Beranda
              </Button>
            </Link>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          © 2025 DetsoNet. All rights reserved.
        </p>
      </div>
    </div>
  );
}
