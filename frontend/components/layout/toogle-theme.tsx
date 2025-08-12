import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export const ToggleTheme = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentTheme = theme === 'system' ? systemTheme : theme;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Tema Tampilan
      </label>
      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-1 flex-1">
          {currentTheme === 'dark' ? (
            <Moon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <Sun className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {currentTheme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
          </span>
        </div>
        
        <div className="flex bg-white dark:bg-gray-700 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-600">
          <Button
            onClick={() => setTheme("light")}
            size="sm"
            variant={theme === "light" ? "default" : "ghost"}
            className={`h-8 px-3 transition-all duration-200 ${
              theme === "light" 
                ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm" 
                : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="sr-only">Terang</span>
          </Button>
          
          <Button
            onClick={() => setTheme("system")}
            size="sm"
            variant={theme === "system" ? "default" : "ghost"}
            className={`h-8 px-3 transition-all duration-200 ${
              theme === "system" 
                ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm" 
                : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span className="sr-only">Sistem</span>
          </Button>
          
          <Button
            onClick={() => setTheme("dark")}
            size="sm"
            variant={theme === "dark" ? "default" : "ghost"}
            className={`h-8 px-3 transition-all duration-200 ${
              theme === "dark" 
                ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm" 
                : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
            }`}
          >
            <Moon className="w-4 h-4" />
            <span className="sr-only">Gelap</span>
          </Button>
        </div>
      </div>
    </div>
  );
};