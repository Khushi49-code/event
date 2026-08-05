"use client";

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer'; // Import Footer
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 min-w-0 [container-type:inline-size] relative">
          {/* 🌟 GLOBAL SUPPORT BUTTON */}
          <div className="fixed bottom-8 right-8 z-50">
            <Link href="/support">
              <Button className="rounded-full shadow-lg px-4 py-6 gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <HelpCircle className="h-5 w-5" />
                <span className="hidden sm:inline">Help & Support</span>
              </Button>
            </Link>
          </div>

          {children}
        </main>
        <Footer /> {/* Add Footer here - outside main but inside flex column */}
      </div>
    </div>
  );
}