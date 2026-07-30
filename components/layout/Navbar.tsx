// components/layout/Navbar.tsx (Complete)
"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname } from 'next/navigation';

const pageTitles: { [key: string]: string } = {
  '/': 'Dashboard',
  '/events': 'Events',
  '/events/create': 'Create Event',
  '/invitations': 'Invitations',
  '/invitations/builder': 'Invitation Builder',
  '/guests': 'Guest Management',
  '/rsvp': 'RSVP Management',
  '/accommodation': 'Accommodation Management',
  '/whatsapp': 'WhatsApp Automation',
  '/analytics': 'Analytics Dashboard',
};

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New RSVP from John Doe', time: '5 min ago', read: false },
    { id: 2, message: '3 guests confirmed for Wedding', time: '1 hour ago', read: false },
    { id: 3, message: 'Reminder: Event tomorrow', time: '2 hours ago', read: true },
  ]);

  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();

  const pageTitle = pageTitles[pathname || '/'] || 'EventPro';
  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleNotification = (id: number) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, read: !n.read } : n
      )
    );
  };

  // Close dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Left: Page Title & Mobile Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {pageTitle}
          </h1>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex items-center flex-1 max-w-xl mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search events, guests, or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="text-yellow-500" />
            ) : (
              <Moon size={20} className="text-gray-600" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(prev => !prev)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-gray-500">No notifications</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => toggleNotification(notif.id)}
                        className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                          !notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <p className="text-sm">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.displayName?.[0] || 'U'}
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.displayName || 'User'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </header>
  );
}