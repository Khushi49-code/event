// components/layout/Navbar.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/providers/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import {
  Bell,
  Search,
  User,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  HelpCircle,
  Calendar,
  Users,
  Mail,
  Home,
  BarChart3,
  Hotel,
  MessageSquare,
  Gift,
  Sparkles,
  UserCircle,
  Shield,
  CreditCard,
  LayoutDashboard,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'rsvp' | 'guest' | 'event' | 'message' | 'system';
  link?: string;
}

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

const notificationIcons = {
  rsvp: Gift,
  guest: Users,
  event: Calendar,
  message: MessageSquare,
  system: Bell,
};

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New RSVP',
      message: 'John Doe confirmed attendance for Wedding',
      time: '5 min ago',
      read: false,
      type: 'rsvp',
      link: '/rsvp'
    },
    {
      id: '2',
      title: 'Guest Added',
      message: 'Jane Smith was added as a guest',
      time: '1 hour ago',
      read: false,
      type: 'guest',
      link: '/guests'
    },
    {
      id: '3',
      title: 'Event Reminder',
      message: 'Corporate Event starts in 3 days',
      time: '2 hours ago',
      read: true,
      type: 'event',
      link: '/events'
    },
    {
      id: '4',
      title: 'Message Sent',
      message: 'Reminder sent to 25 guests',
      time: '3 hours ago',
      read: true,
      type: 'message',
      link: '/whatsapp'
    },
  ]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const pageTitle = pageTitles[pathname || '/'] || 'EventPro';
  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    toast.success('All notifications marked as read');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Left: Mobile Menu Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {pageTitle}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Center: Search Bar (Desktop) */}
        <div className="hidden md:flex items-center flex-1 max-w-xl mx-4">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search events, guests, or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 rounded">
              ⌘K
            </kbd>
          </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Search Toggle (Mobile) */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Search"
          >
            <Search size={20} />
          </button>

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
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="danger" className="ml-2">
                        {unreadCount} new
                      </Badge>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const Icon = notificationIcons[notification.type] || Bell;
                      return (
                        <Link
                          key={notification.id}
                          href={notification.link || '#'}
                          onClick={() => {
                            markAsRead(notification.id);
                            setShowNotifications(false);
                          }}
                          className={cn(
                            "flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0",
                            !notification.read && "bg-blue-50 dark:bg-blue-900/20"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg flex-shrink-0",
                            !notification.read ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-700"
                          )}>
                            <Icon className={cn(
                              "h-4 w-4",
                              !notification.read ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/notifications"
                    className="block text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => setShowNotifications(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors p-1"
              aria-label="User menu"
            >
              <Avatar
                src={user?.photoURL || undefined}
                fallback={user?.displayName || user?.email?.[0] || 'U'}
                size="sm"
              />
              <ChevronDown size={16} className="text-gray-500 dark:text-gray-400 hidden sm:block" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={user?.photoURL || undefined}
                      fallback={user?.displayName || user?.email?.[0] || 'U'}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {user?.displayName || 'User'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link
                    href="/help"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Help & Support
                  </Link>
                </div>

                <DropdownMenuSeparator />

                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </form>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-0 left-0 w-64 h-full bg-white dark:bg-gray-800 shadow-xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xl font-bold text-gray-900 dark:text-white">EventPro</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="space-y-1">
              {[
                { name: 'Dashboard', icon: Home, href: '/' },
                { name: 'Events', icon: Calendar, href: '/events' },
                { name: 'Invitations', icon: Mail, href: '/invitations' },
                { name: 'Guests', icon: Users, href: '/guests' },
                { name: 'RSVP', icon: Gift, href: '/rsvp' },
                { name: 'Accommodation', icon: Hotel, href: '/accommodation' },
                { name: 'WhatsApp', icon: MessageSquare, href: '/whatsapp' },
                { name: 'Analytics', icon: BarChart3, href: '/analytics' },
              ].map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="absolute bottom-4 left-4 right-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcut for search */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('keydown', function(e) {
              if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]');
                if (searchInput) {
                  searchInput.focus();
                }
              }
            });
          `
        }}
      />
    </header>
  );
}