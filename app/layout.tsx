// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext'; // ✅ Correct import
import { cn } from "@/lib/utils";
import SupportChatbot from '@/components/SupportChatbot';
import EventAgentWidget from '@/components/EventAgentWidget';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const inter = Inter({ subsets: ['latin'] });

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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme="light"
        >
          <AuthProvider>
            {children}
            <EventAgentWidget />
            <SupportChatbot />
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