"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:
              "!bg-surface !text-text !border !border-border !shadow-[var(--shadow-float)] !rounded-[10px] !font-sans",
            description: "!text-muted",
          },
        }}
      />
    </ThemeProvider>
  );
}
