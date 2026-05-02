/** @type {import('tailwindcss').Config} */
module.exports = {
  // Mode dark berbasis class
  darkMode: "class",

  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  // Wajib ada untuk NativeWind v4
  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      fontFamily: {
        "sf-regular": ["SF-Pro-Regular"],
        "sf-medium": ["SF-Pro-Medium"],
        "sf-semibold": ["SF-Pro-Semibold"],
        "sf-bold": ["SF-Pro-Bold"],
        "sf-heavy": ["SF-Pro-Heavy"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Network topology semantic colors
        "fiber-line": "#14B8A6", // teal-500
        "drop-cable": "#22D3EE", // cyan-400
        "node-server": "#0F766E", // teal-700
        "node-odp": "#0891B2", // cyan-600
        "service-active": "#10B981", // emerald-500
        "service-inactive": "#EF4444", // red-500
        "service-suspended": "#F59E0B", // amber-500
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
