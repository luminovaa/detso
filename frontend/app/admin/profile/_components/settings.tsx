import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export const ThemeSettingsCard = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const displayTheme = currentTheme === 'dark' ? 'Gelap' : 'Terang';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Pengaturan Tema
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pilih tema tampilan yang sesuai dengan preferensi Anda
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-border bg-muted p-2">
              {currentTheme === 'dark' ? (
                <Moon className="h-4 w-4 text-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium font-sm text-foreground">
                Tema {displayTheme}
              </p>
              <p className="text-xs text-muted-foreground">
                {theme === 'system'
                  ? 'Mengikuti pengaturan sistem'
                  : `Mode ${displayTheme.toLowerCase()} aktif`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {/* Mode Terang */}
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center rounded-md p-2 transition-all duration-200 ${
                theme === 'light'
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-border hover:text-foreground'
              }`}
              title="Mode Terang"
            >
              <Sun className="h-4 w-4" />
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`flex items-center justify-center rounded-md p-2 transition-all duration-200 ${
                theme === 'system'
                  ? 'bg-background text-secondary shadow-sm'
                  : 'text-muted-foreground hover:bg-border hover:text-foreground'
              }`}
              title="Ikuti Sistem"
            >
              <Monitor className="h-4 w-4" />
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center rounded-md p-2 transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-background text-accent shadow-sm'
                  : 'text-muted-foreground hover:bg-border hover:text-foreground'
              }`}
              title="Mode Gelap"
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};