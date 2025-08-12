'use client';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Wifi, Zap, Crown, Users } from "lucide-react";
import { useState, useEffect } from "react";

enum PopularPlan {
  NO = 0,
  YES = 1,
}

interface PlanProps {
  title: string;
  popular: PopularPlan;
  price: number;
  speed: string;
  description: string;
  buttonText: string;
  benefitList: string[];
  icon: React.ReactNode;
  gradient: string;
}

const plans: PlanProps[] = [
  {
    title: "Paket Basic",
    popular: 0,
    price: 150000,
    speed: "10 Mbps",
    description: "Cocok untuk kebutuhan browsing dan streaming ringan sehari-hari",
    buttonText: "Pilih Paket",
    icon: <Wifi className="w-8 h-8" />,
    gradient: "from-blue-500 to-cyan-500",
    benefitList: [
      "Pemasangan Registrasi Rp. 100.000",
      "Kecepatan 10 Mbps",
      "Unlimited quota",
      "Support 24/7",
      "Router dan Kabel dari Pihak Jasa / difasilitasi / dipinjami",
    ],
  },
  {
    title: "Paket Basic Plus",
    popular: 1,
    price: 180000,
    speed: "15 Mbps",
    description: "Ideal untuk keluarga dengan kebutuhan streaming dan gaming",
    buttonText: "Pilih Paket Terbaik",
    icon: <Zap className="w-8 h-8" />,
    gradient: "from-blue-500 to-cyan-500",
    benefitList: [
      "Pemasangan Registrasi Rp. 100.000",
      "Kecepatan 15 Mbps",
      "Unlimited quota",
      "Priority support",
      "Router dan Kabel dari Pihak Jasa / difasilitasi / dipinjami",
    ],
  },
  {
    title: "Paket Premium",
    popular: 0,
    price: 225000,
    speed: "20 Mbps",
    description: "Terbaik untuk streaming 4K tanpa buffering dan gaming online",
    buttonText: "Pilih Paket",
    icon: <Wifi className="w-8 h-8" />,
    gradient: "from-blue-500 to-cyan-500",
    benefitList: [
      "Pemasangan Registrasi Rp. 100.000",
      "Kecepatan 20 Mbps",
      "Unlimited quota",
      "Priority support",
      "Router dan Kabel dari Pihak Jasa / difasilitasi / dipinjami",
    ],
  },
  {
    title: "Paket Premium 2",
    popular: 0,
    price: 250000,
    speed: "35 Mbps",
    description: "Pilihan tepat untuk keluarga besar atau kantor kecil yang membutuhkan koneksi stabil dan cepat.",
    buttonText: "Pilih Paket",
    icon: <Wifi className="w-8 h-8" />,
    gradient: "from-blue-500 to-cyan-500",
    benefitList: [
      "Pemasangan Registrasi Rp. 100.000",
      "Kecepatan 35 Mbps",
      "Unlimited quota",
      "Priority support",
      "Router dan Kabel dari Pihak Jasa / difasilitasi / dipinjami",
    ],
  },
  {
    title: "Paket Enterprise",
    popular: 0,
    price: 350000,
    speed: "50 Mbps",
    description: "Dirancang untuk kebutuhan internet kantor dengan performa stabil dan dukungan maksimal.",
    buttonText: "Pilih Paket",
    icon: <Crown className="w-8 h-8" />,
    gradient: "from-blue-500 to-cyan-500",
    benefitList: [
      "Pemasangan Registrasi Rp. 100.000",
      "Kecepatan 50 Mbps",
      "Unlimited quota",
      "Dedicated support",
      "Router dan Kabel dari Pihak Jasa / difasilitasi / dipinjami",
    ],
  },
  {
    title: "Paket Enterprise 2",
    popular: 0,
    price: 620000,
    speed: "100 Mbps",
    description: "Solusi terbaik untuk bisnis dan kebutuhan bandwidth tinggi",
    buttonText: "Pilih Paket",
    icon: <Crown className="w-8 h-8" />,
    gradient: "from-blue-500 to-cyan-500",
    benefitList: [
      "Pemasangan Registrasi Rp. 100.000",
      "Kecepatan 100 Mbps",
      "Unlimited quota",
      "Dedicated support",
      "Router dan Kabel dari Pihak Jasa / difasilitasi / dipinjami",
    ],
  },
];

export const PricingSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('pricing-section');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section id="pricing-section" className="container py-24 sm:py-32">
      {/* Header with animation */}
      <div className={`text-center transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}>
        <div className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent text-lg font-semibold mb-2 tracking-wider">
          <Wifi className="w-5 h-5 mr-2 text-blue-500" />
          Paket Internet
        </div>

        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Pilih Paket Internet
          <span className="block text-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text">
            Sesuai Kebutuhan Anda
          </span>
        </h2>

        <p className="md:w-1/2 mx-auto text-xl text-muted-foreground pb-14">
          Nikmati koneksi internet fiber optik super cepat dengan harga terjangkau. 
          Semua paket sudah termasuk unlimited quota dan gratis instalasi.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-6">
        {plans.map(({ title, popular, price, speed, description, buttonText, benefitList, icon, gradient }, index) => (
          <div
            key={title}
            className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
            }`}
            style={{ transitionDelay: `${index * 200}ms` }}
            onMouseEnter={() => setHoveredCard(title)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <Card
              className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl ${
                popular === PopularPlan.YES
                  ? "border-2 border-purple-500 shadow-purple-500/20 lg:scale-[1.05] shadow-2xl"
                  : "hover:border-primary/50"
              } ${
                hoveredCard === title ? 'scale-105 shadow-xl' : ''
              }`}
            >
              {/* Popular Badge */}
              {popular === PopularPlan.YES && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-bl-lg text-sm font-medium shadow-lg">
                  <div className="flex items-center">
                    <Crown className="w-4 h-4 mr-1" />
                    Terpopuler
                  </div>
                </div>
              )}

              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />

              <CardHeader className="relative">
                {/* Icon with gradient background */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${gradient} text-white mb-4 shadow-lg`}>
                  {icon}
                </div>

                <CardTitle className="text-xl font-bold mb-2">{title}</CardTitle>
                
                <CardDescription className="text-sm text-muted-foreground mb-4">
                  {description}
                </CardDescription>

                {/* Speed Badge */}
                <div className={`inline-flex items-center bg-gradient-to-r ${gradient} text-white px-3 py-1 rounded-full text-sm font-medium mb-4 shadow-md`}>
                  <Zap className="w-4 h-4 mr-1" />
                  {speed}
                </div>

                {/* Price */}
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">{formatPrice(price)}</span>
                  <span className="text-muted-foreground text-sm ml-1">/bulan</span>
                </div>
              </CardHeader>

              <CardContent className="relative">
                <div className="space-y-3">
                  {benefitList.map((benefit, benefitIndex) => (
                    <div
                      key={benefit}
                      className={`flex items-center transform transition-all duration-500 ${
                        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0'
                      }`}
                      style={{ transitionDelay: `${(index * 200) + (benefitIndex * 100)}ms` }}
                    >
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center mr-3`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="relative">
                <Button
                  className={`w-full font-semibold transition-all duration-300 ${
                    popular === PopularPlan.YES
                      ? `bg-gradient-to-r ${gradient} hover:shadow-lg hover:shadow-purple-500/25 text-white border-0`
                      : "hover:shadow-lg"
                  }`}
                  variant={popular === PopularPlan.YES ? "default" : "outline"}
                >
                  {buttonText}
                  {popular === PopularPlan.YES && (
                    <Crown className="w-4 h-4 ml-2" />
                  )}
                </Button>
              </CardFooter>

              {/* Hover Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-500 pointer-events-none ${
                hoveredCard === title ? 'opacity-5' : ''
              }`} />
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
};