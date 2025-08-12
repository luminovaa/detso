import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/layout/theme-provider";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Detsonet - Internet Service Provider",
  description: "Detsonet is a leading Internet Service Provider (ISP) in Indonesia, offering high-speed internet solutions for homes and businesses.",
  keywords: [
    "Detsonet",
    "Internet Service Provider",
    "ISP Indonesia",
    "High-Speed Internet",
    "Home Internet Solutions",
    "Business Internet Solutions",
    "Fiber Optic Internet",
    "Reliable ISP",
    "Affordable Internet Plans",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Detsonet - Internet Service Provider",
    description: "Detsonet is a leading Internet Service Provider (ISP) in Indonesia, offering high-speed internet solutions for homes and businesses.",
    url: "https://www.detsonet.co.id ",
    siteName: "Detsonet",
    images: [
      {
        url: "https://www.detsonet.co.id/og-image.jpg ",
        width: 800,
        height: 600,
        alt: "Detsonet Logo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Detsonet - Internet Service Provider",
    description: "Detsonet is a leading Internet Service Provider (ISP) in Indonesia, offering high-speed internet solutions for homes and businesses.",
    images: ["https://www.detsonet.co.id/og-image.jpg "],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" href="/logo.png" type="image/png"/>
      </head>
      <body className={cn("min-h-screen bg-background", inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
