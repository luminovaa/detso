"use client";
import { useEffect, useState, useRef } from "react";
import { MapPin, Wifi, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const CoverageAreaSection = () => {
  const mapRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Setup intersection observer for animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (mapRef.current) {
      observer.observe(mapRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      // Dynamically import Leaflet
      import("leaflet").then((L) => {
        // Import CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        // Initialize map
        const map = L.map("coverage-map").setView([-7.39, 112.584], 15);

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
          tileSize: 256,
          minZoom: 12,
        }).addTo(map);

        // Krian area boundary (approximate coordinates)
        const krianBoundary = [
          { lat: -7.384, lng: 112.585 },
          { lat: -7.385, lng: 112.59 },
          { lat: -7.39, lng: 112.59 },
          { lat: -7.39, lng: 112.59 },
          { lat: -7.394, lng: 112.59 },
          { lat: -7.399, lng: 112.578 },
          { lat: -7.39, lng: 112.5775 },
        ];

        // Add coverage area polygon
        L.polygon(krianBoundary as L.LatLngExpression[], {
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.3,
          weight: 3,
        })
          .addTo(map)
          .bindPopup("Area Jangkauan Detsonet Krian");

        // Add coverage points
        const coveragePoints = [
          { lat: -7.39, lng: 112.579, name: "Krian Pusat", status: "active" },
          {
            lat: -7.395,
            lng: 112.585,
            name: "Krian Selatan",
            status: "active",
          },
          { lat: -7.389, lng: 112.588, name: "Krian Utara", status: "active" },
          { lat: -7.39, lng: 112.584, name: "Krian Timur", status: "active" },
          {
            lat: -7.385,
            lng: 112.587,
            name: "Krian Barat",
            status: "coming-soon",
          },
        ];

        coveragePoints.forEach((point) => {
          const icon = L.divIcon({
            className: "custom-div-icon",
            html: `<div class="w-4 h-4 ${
              point.status === "active" ? "bg-green-500" : "bg-yellow-500"
            } rounded-full border-2 border-white shadow-lg"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          L.marker([point.lat, point.lng], { icon }).addTo(map).bindPopup(`
              <div class="text-center">
                <h3 class="font-semibold">${point.name}</h3>
                <p class="text-sm ${
                  point.status === "active"
                    ? "text-green-600"
                    : "text-yellow-600"
                }">
                  ${point.status === "active" ? "Aktif" : "Segera Hadir"}
                </p>
              </div>
            `);
        });

        // Cleanup function
        return () => {
          map.remove();
        };
      });
    }
  }, [mounted]);

  const coverageStats = [
    {
      icon: CheckCircle,
      label: "Area Terjangkau",
      value: "95%",
      color: "text-green-500",
    },
    {
      icon: Wifi,
      label: "Titik Akses",
      value: "25+",
      color: "text-blue-500",
    },
    {
      icon: Clock,
      label: "Waktu Instalasi",
      value: "1-2 Hari",
      color: "text-purple-500",
    },
  ];

  return (
    <section id="area" className="py-20 to-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div
              className={`transform transition-all duration-700 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <Badge variant="outline" className="mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                Area Jangkauan
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Jangkauan Layanan
                <span className="block text-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text">
                  Detsonet Krian
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Kami melayani seluruh wilayah Krian dengan jaringan fiber optik
                berkualitas tinggi. Periksa ketersediaan layanan di area Anda.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Map Section */}
            <div
              ref={mapRef}
              className={`lg:col-span-2 transform transition-all duration-1000 delay-200 ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "translate-x-10 opacity-0"
              }`}
            >
              <Card className="overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                  <div id="coverage-map" className="h-[500px] w-full"></div>
                </CardContent>
              </Card>
            </div>

            {/* Info Panel */}
            <div
              className={`space-y-6 transform transition-all duration-1000 delay-400 ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "translate-x-10 opacity-0"
              }`}
            >
              {/* Coverage Stats */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Status Jangkauan</h3>
                {coverageStats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-card rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      <span className="text-sm">{stat.label}</span>
                    </div>
                    <span className="font-semibold">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Keterangan</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Area Aktif</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Segera Hadir</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500/30 border-2 border-blue-500 rounded"></div>
                      <span className="text-sm">Area Jangkauan</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Info */}
          <div
            className={`grid md:grid-cols-3 gap-6 mt-12 transform transition-all duration-1000 delay-600 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-6 h-6 text-blue-500" />
                </div>
                <h4 className="font-semibold mb-2">Instalasi Cepat</h4>
                <p className="text-sm text-muted-foreground">
                  Proses instalasi hanya membutuhkan waktu 1-2 hari kerja
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <h4 className="font-semibold mb-2">Garansi Kualitas</h4>
                <p className="text-sm text-muted-foreground">
                  Jaminan kualitas sinyal dan kecepatan sesuai paket
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-purple-500" />
                </div>
                <h4 className="font-semibold mb-2">Ekspansi Berkelanjutan</h4>
                <p className="text-sm text-muted-foreground">
                  Kami terus memperluas jangkauan ke area baru
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
