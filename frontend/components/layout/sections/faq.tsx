'use client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Wifi, Clock, Shield, Wrench, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
  icon: React.ReactNode;
}

const FAQList: FAQProps[] = [
  {
    question: "Berapa lama proses instalasi internet?",
    answer: "Proses instalasi biasanya memakan waktu 1-3 hari kerja setelah pembayaran konfirmasi. Tim teknis kami akan menghubungi Anda untuk mengatur jadwal instalasi yang sesuai. Instalasi mencakup pemasangan kabel fiber optik, konfigurasi router, dan testing koneksi.",
    value: "item-1",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    question: "Apakah ada batasan kuota atau FUP (Fair Usage Policy)?",
    answer: "Tidak ada batasan kuota untuk semua paket kami. Kami menggunakan sistem unlimited tanpa throttling atau pengurangan kecepatan.",
    value: "item-2",
    icon: <Wifi className="w-5 h-5" />,
  },
  {
    question: "Bagaimana sistem pembayaran dan tagihan bulanan?",
    answer: "Pembayaran dapat dilakukan melalui transfer bank, e-wallet (OVO, GoPay, Dana), atau cash ke admin kami. Tagihan dikirim setiap tanggal 1 dan jatuh tempo tanggal 15 setiap bulan.",
    value: "item-3",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    question: "Apa yang harus dilakukan jika internet bermasalah?",
    answer: "Hubungi customer service kami di nomor 0800-1234-5678 atau melalui WhatsApp 24/7. Tim technical support kami akan membantu troubleshooting secara remote. Jika diperlukan, teknisi akan datang ke lokasi tanpa biaya tambahan untuk perbaikan.",
    value: "item-4",
    icon: <Wrench className="w-5 h-5" />,
  },
  {
    question: "Apakah tersedia layanan untuk wilayah saya?",
    answer: "Kami melayani area Krian, Sidoarjo dan Sekitarnya. Untuk memastikan coverage area, silakan hubungi customer service dengan menyebutkan alamat lengkap Anda. Tim kami akan mengecek ketersediaan jaringan fiber optik di lokasi Anda.",
    value: "item-5",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    question: "Bisakah upgrade atau downgrade paket di tengah periode?",
    answer: "Ya, Anda dapat mengubah paket kapan saja dengan memberitahu customer service minimal 3 hari sebelum tanggal billing. Perubahan akan efektif pada periode billing berikutnya. Tidak ada biaya administrasi untuk perubahan paket.",
    value: "item-6",
    icon: <HelpCircle className="w-5 h-5" />,
  },
];

export const FAQSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('faq-section');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="faq-section" className="container md:w-[800px] py-24 sm:py-32">
      {/* Header with animation */}
      <div className={`text-center mb-12 transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}>
        <div className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent text-lg font-semibold mb-2 tracking-wider">
          <HelpCircle className="w-5 h-5 mr-2 text-blue-500" />
          FAQ
        </div>

        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Pertanyaan yang Sering
          <span className="block text-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text">
            Ditanyakan
          </span>
        </h2>

        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Temukan jawaban untuk pertanyaan umum tentang layanan internet kami. 
          Jika tidak menemukan jawaban yang Anda cari, jangan ragu untuk menghubungi tim support kami.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className={`transform transition-all duration-1000 delay-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}>
        <Accordion 
          type="single" 
          collapsible 
          className="space-y-4"
          onValueChange={setOpenItem}
        >
          {FAQList.map(({ question, answer, value, icon }, index) => (
            <div
              key={value}
              className={`transform transition-all duration-700 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${400 + (index * 100)}ms` }}
            >
              <AccordionItem 
                value={value}
                className="border border-border/50 rounded-lg px-6 py-2 bg-card hover:bg-muted/50 transition-all duration-300 hover:shadow-lg hover:border-primary/20"
              >
                <AccordionTrigger className="text-left hover:no-underline group">
                  <div className="flex items-center space-x-3">
                    {/* Icon with dynamic color */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      openItem === value 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                        : 'bg-muted text-muted-foreground group-hover:bg-blue-500/10 group-hover:text-blue-500'
                    }`}>
                      {icon}
                    </div>
                    
                    {/* Question text */}
                    <span className="font-medium text-base group-hover:text-primary transition-colors duration-300">
                      {question}
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="text-muted-foreground leading-relaxed pt-4 pb-2 pl-13">
                  <div className="relative">
                    {/* Animated border */}
                    <div className="absolute -left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 opacity-30"></div>
                    
                    {/* Answer content */}
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed">
                        {answer}
                      </p>                        
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </div>
          ))}
        </Accordion>
      </div>
    </section>
  );
};