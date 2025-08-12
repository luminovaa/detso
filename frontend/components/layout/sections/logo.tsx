'use client';
import Image from "next/image";
import { useState, useEffect } from "react";

const logoData = [
  { name: "Iforte Indonesia", logo: "/iforte.png" },
  { name: "MGS", logo: "/mgs.png" },
  { name: "DetsoNet", logo: "/logo.png" },
];

export const LogoMarqueeSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.1 }
    );
    const section = document.getElementById('logo-marquee-section');
    if (section) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const marqueeLogos = [...logoData, ...logoData, ...logoData, ...logoData];

  return (
    <section id="logo-marquee-section" className="py-16 overflow-hidden">
      <div className="relative">

        {/* Marquee Container */}
        <div className={`overflow-hidden duration-1000`}>
          <div className="animate-marquee flex w-[fit-content]">
            {marqueeLogos.map((logo, index) => (
              <div key={`${logo.name}-${index}`} className="mx-16 flex-shrink-0">
                <Image
                  src={logo.logo}
                  alt={logo.name}
                  width={160}
                  unoptimized={true}
                  height={64}
                  className="h-12 w-auto object-contain transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};