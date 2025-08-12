'use client';
import Image from "next/image";
import { useEffect, useState } from "react";

interface ProblemsProps {
  icon: string;
  title: string;
}

const problemList: ProblemsProps[] = [
  { icon: "/problem/wifi.png", title: "Kuota Sering Habis" },
  { icon: "/problem/dollar.png", title: "Biaya Internet Mahal" },
  { icon: "/problem/radio-tower.png", title: "Butuh Koneksi Stabil" },
  { icon: "/problem/24-hours-support.png", title: "Membutuhkan Pelayanan Terbaik" },
];

export const ProblemsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleItems, setVisibleItems] = useState<boolean[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    const itemTimers = problemList.map((_, index) =>
      setTimeout(() => {
        setVisibleItems((prev) => {
          const newVisible = [...prev];
          newVisible[index] = true;
          return newVisible;
        });
      }, 300 + index * 150)
    );

    return () => {
      clearTimeout(timer);
      itemTimers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  return (
    <section
      id="problems"
      className="w-full min-h-[50vh] flex flex-col lg:flex-row items-start lg:items-center justify-center bg-black dark:bg-white px-6 sm:px-6 lg:px-8 py-8"
    >
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Column - Title Section */}
        <div className="text-left">
          <div
            className={`transform transition-all duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <span className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent text-base sm:text-lg font-semibold mb-2 tracking-wider">
              Permasalahan Umum
            </span>
          </div>
          <h2
            className={`text-lg sm:text-2xl lg:text-3xl font-bold mb-4 text-white dark:text-black transform transition-all duration-700 delay-200 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            Pernahkah Anda Mengalami{" "}
            <span className="text-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text">
              Masalah
            </span>{" "}
            Seperti Ini?
          </h2>
          <p
            className={`text-sm sm:text-base leading-loose text-gray-300 dark:text-gray-700 transform transition-all duration-700 delay-300 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            Kebanyakan orang mengalami kendala ini dalam kehidupan digital mereka.
          </p>
        </div>

        {/* Right Column - Grid 2x2 Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {problemList.map(({ icon, title }, index) => (
            <div
              key={title}
              className={`group flex items-center transform transition-all duration-500 sm:duration-700 ${
                visibleItems[index] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 p-0.5 mr-3 sm:mr-4 transform transition-all duration-300 group-hover:scale-110">
                <div className="w-full h-full rounded-xl bg-white dark:bg-black flex items-center justify-center">
                  <Image
                    src={icon}
                    alt={title}
                    width={20}
                    height={20}
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  />
                </div>
              </div>
              <h4 className="text-base sm:text-lg font-semibold text-white dark:text-black">
                {title}
              </h4>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};