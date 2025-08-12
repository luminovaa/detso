"use client";
import React, { useState } from "react";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/admin/context/auth-provider";
import Image from "next/image";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData);
    } catch (err) {
      setError("Email/username atau password salah.");
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? "dark" : ""}`}>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed top-4 right-4 p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-all duration-200 z-50`}
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div
        className={`hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center px-12 py-16 bg-card shadow-light dark:shadow-dark`}
      >
        <div className="max-w-lg">
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="bg-primary p-3 rounded-xl mr-4">
                <Image
                  src="/logo.png"
                  alt="Detsonet Logo"
                  width={100}
                  height={100}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Detsonet
                </h1>
                <p className="text-muted-foreground">Internet Service Provider</p>
              </div>
            </div>
            <div className="mb-12">
              <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                Detsonet merupakan penyedia layanan internet di daerah Krian
                Sidoarjo sejak 2020, dan terus berkembang memberikan layanan
                terbaik untuk masyarakat.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Kami menyediakan koneksi internet yang stabil dan cepat untuk
                rumah tangga dan bisnis.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center">
              <div className="bg-primary p-2 rounded-lg mr-3">
                <svg
                  className="w-6 h-6 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Detsonet</h1>
            </div>
          </div>

          <div
            className={`bg-card border rounded-2xl p-8 shadow-light dark:shadow-dark`}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Selamat Datang
              </h2>
              <p className="text-muted-foreground">
                Masuk ke dashboard manajemen Detsonet
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email atau Username
                </label>
                <input
                  name="identifier"
                  type="text"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background border border-input text-foreground placeholder-muted-foreground rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  placeholder="Masukkan email atau username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background border border-input text-foreground placeholder-muted-foreground rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 pr-12"
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-primary"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 text-sm text-muted-foreground"
                  >
                    Ingat saya
                  </label>
                </div>
                <button
                  type="button"
                  className="text-sm text-secondary hover:text-primary/80"
                >
                  Lupa password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-primary-foreground transition-all duration-200 ${
                  isLoading
                    ? "bg-primary/50 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
                    Memuat...
                  </div>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <button className="text-secondary hover:text-primary/80 font-medium">
                  Hubungi Administrator
                </button>
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground">
              © 2025 Detsonet. Hak cipta dilindungi undang-undang.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}