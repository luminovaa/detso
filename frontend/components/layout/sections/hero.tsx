"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wifi, Zap, Shield } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export const HeroSection = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="home" className="container w-full min-h-screen flex items-center">
      <div className="grid lg:grid-cols-2 gap-12 items-center mx-auto max-w-screen-xl py-20">
        {/* Left Content */}
        <div className="space-y-8">
          {/* Badge with animation */}
          <div 
            className={`transform transition-all duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <Badge variant="outline" className="text-sm py-2 px-4">
              {/* <span className="mr-2 text-primary">
                <Badge className="bg-green-500">
                  <Wifi className="w-3 h-3 mr-1" />
                  Aktif
                </Badge>
              </span> */}
              <span>Selamat Datang Di DETSO.NET!</span>
            </Badge>
          </div>

          {/* Main Heading with staggered animation */}
          <div className="space-y-4">
            <h1 
              className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight transform transition-all duration-700 delay-200 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              KUOTA HEMAT
              <span className="block text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text">
                SOLUSI INTERNET TEPAT
              </span>
            </h1>
            
            <p 
              className={`text-lg 
                text-muted-foreground max-w-lg leading-relaxed transform transition-all duration-700 delay-300 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              DETSO. NET Merupakan solusi tepat untuk kebutuhan internet, Nikmati koneksi internet fiber optic hingga 1 Gbps dengan stabilitas tinggi, Harga terjangkau dan layanan 24/7. Cocok untuk Rumah, kantor, Bisnis dan Sekolah.
            </p>
          </div>

          {/* Features with animation */}
          <div 
            className={`grid grid-cols-1 md:grid-cols-3 gap-4 transform transition-all duration-700 delay-400 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="flex items-center space-x-2 text-sm">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Kecepatan Tinggi</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Keamanan Terjamin</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Wifi className="w-4 h-4 text-blue-500" />
              <span>Koneksi Stabil</span>
            </div>
          </div>

          {/* CTA Buttons with animation */}
          <div 
            className={`flex flex-col sm:flex-row gap-4 transform transition-all duration-700 delay-500 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <Button size="lg" className="font-bold group/arrow bg-gradient-to-r from-primary to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Link href="https://wa.me/6289685402863" target="_blank">
              Berlangganan Detsonet Sekarang
              </Link>
              <ArrowRight className="size-5 ml-2 group-hover/arrow:translate-x-1 transition-transform" />
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="font-bold border-2 hover:bg-muted/50"
            >
              <Link href="#pricing-section" className="flex items-center">
                Lihat Paket Internet
              </Link>
            </Button>
          </div>

          {/* Stats with animation */}
          <div 
            className={`grid grid-cols-2 gap-6 pt-6 border-t border-muted transform transition-all duration-700 delay-600 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            {/* <div className="text-center">
              <div className="text-2xl font-bold text-primary">300+</div>
              <div className="text-sm text-muted-foreground">Pelanggan Aktif</div>
            </div> */}
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative order-first lg:order-last">
          <div 
            className={`transform transition-all duration-1000 delay-300 ${
              isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-10 opacity-0 scale-95'
            }`}
          >
            {/* Main image with glow outline */}
            <div className="relative">
              {/* Glow outline effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-60 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full blur-xl opacity-40"></div>
              
              {mounted && (
                <Image
                  width={600}
                  height={600}
                  className="relative z-10 w-full h-auto rounded-full shadow-2xl"
                  src="/hero.png"
                  alt="Happy customer using fast internet"
                  priority
                />
              )}
            </div>

            {/* Floating Icons around the image */}
            {/* WiFi Icon - Top Right */}
            <div className={`absolute -top-8 -right-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-full shadow-2xl transform transition-all duration-1000 delay-700 ${
              isVisible ? 'translate-y-0 opacity-100 rotate-0' : 'translate-y-10 opacity-0 rotate-45'
            }`}>
              <Wifi className="w-8 h-8" />
            </div>

            {/* Speed Icon - Top Left */}
            <div className={`absolute -top-4 -left-12 bg-gradient-to-br from-purple-500 to-purple-600 text-white p-3 rounded-full shadow-2xl transform transition-all duration-1000 delay-800 ${
              isVisible ? 'translate-y-0 opacity-100 rotate-0' : 'translate-y-10 opacity-0 -rotate-45'
            }`}>
              <Zap className="w-6 h-6" />
            </div>

            {/* Shield Icon - Bottom Right */}
            <div className={`absolute -bottom-8 -right-4 bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl transform transition-all duration-1000 delay-900 ${
              isVisible ? 'translate-y-0 opacity-100 rotate-0' : 'translate-y-10 opacity-0 rotate-45'
            }`}>
              <Shield className="w-7 h-7" />
            </div>

            {/* Router Icon - Bottom Left */}
            <div className={`absolute -bottom-4 -left-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white p-3 rounded-full shadow-2xl transform transition-all duration-1000 delay-1000 ${
              isVisible ? 'translate-y-0 opacity-100 rotate-0' : 'translate-y-10 opacity-0 -rotate-45'
            }`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>

            {/* Signal Icon - Middle Right */}
            <div className={`absolute top-1/2 -right-12 transform -translate-y-1/2 bg-gradient-to-br from-pink-500 to-pink-600 text-white p-3 rounded-full shadow-2xl transition-all duration-1000 delay-1100 ${
              isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-10 opacity-0 scale-75'
            }`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48L3.15 12.95zM7.8 12.9l1.48-.85L10.13 14l-1.48.85L7.8 12.9zm8.4 0l-.85 1.48L14.87 14l1.48-.85L16.2 12.9zm5.65.05L20.85 14l-.85-1.48L21.85 12.95zM12 8c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z"/>
              </svg>
            </div>

            {/* Cloud Icon - Middle Left */}
            <div className={`absolute top-1/2 -left-12 transform -translate-y-1/2 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-3 rounded-full shadow-2xl transition-all duration-1000 delay-1200 ${
              isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-10 opacity-0 scale-75'
            }`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
              </svg>
            </div>

            {/* Floating status badges */}
            <div className={`absolute top-8 right-8 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg transform transition-all duration-1000 delay-600 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
            }`}>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                Online
              </div>
            </div>

            <div className={`absolute bottom-8 left-8 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg transform transition-all duration-1000 delay-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
            }`}>
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                1 Gbps
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </section>
  );
};