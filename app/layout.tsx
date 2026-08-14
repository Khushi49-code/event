// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext'; // ✅ Correct import
import { cn } from "@/lib/utils";

import EventAgentWidget from '@/components/EventAgentWidget';

// NOTE: Geist/Inter from next/font/google were removed because the build
// machine can't reach fonts.googleapis.com (network/VPN/firewall blocking
// it). Using system font stacks instead — no network fetch at build time,
// and visually very close to Geist/Inter on most OSes.
// If you want the exact Geist/Inter fonts back later, download the .woff2
// files and switch to next/font/local instead of next/font/google.

export const metadata: Metadata = {
  title: 'Event Management ERP',
  description: 'Complete event management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans")}>
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme="light"
        >
          <AuthProvider>
            {children}
            <EventAgentWidget />

            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}