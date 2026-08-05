// components/layout/Footer.tsx (with icons)
"use client";

import Link from 'next/link';
import { Shield, FileText, Cookie } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 py-4 px-6 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Left side - Company Name */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          © {currentYear} Event Manager. All rights reserved.
        </p>

        {/* Right side - Links with Icons */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <Link 
            href="/privacy" 
            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Shield className="h-3.5 w-3.5" />
            Privacy
          </Link>
          <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
          <Link 
            href="/terms" 
            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Terms
          </Link>
          <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
       
        </div>
      </div>
    </footer>
  );
}