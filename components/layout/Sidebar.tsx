// components/layout/Sidebar.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Users,
  Mail,
  MessageSquare,
  Home,
  BarChart3,
  Hotel,
  Settings,
  LogOut,
  Menu,
  X,
  Gift,
  HelpCircle,
  UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/config';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';

const menuItems = [
  { name: 'Dashboard', icon: Home, href: '/' },
  { name: 'Events', icon: Calendar, href: '/events' },
  { name: 'Invitations', icon: Mail, href: '/invitations' },
  { name: 'Guests', icon: Users, href: '/guests' },
  { name: 'RSVP', icon: Gift, href: '/rsvp' },
  { name: 'Accommodation', icon: Hotel, href: '/accommodation' },
  { name: 'WhatsApp', icon: MessageSquare, href: '/whatsapp' },

];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <div
        className={cn(
          "bg-gray-900 text-white h-screen transition-all duration-300 flex flex-col fixed lg:relative z-50",
          collapsed ? "w-20" : "w-64",
          isMobile && collapsed && "-translate-x-full"
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!collapsed ? (
            <Link href="/" className="inline-flex items-center gap-3">
              <img
                src="/Logo.png"
                alt="EventFlux Logo"
                className="w-10 h-10 object-contain flex-shrink-0"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-bold tracking-tight text-white leading-none">
                  EventFlux
                </span>
                <span className="text-[10px] text-blue-400 font-semibold tracking-widest uppercase mt-1">
                  ERP
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/" className="mx-auto">
              <img
                src="/Logo.png"
                alt="EventFlux Logo"
                className="w-10 h-10 object-contain"
              />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-700">
          <div className="px-2 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group relative",
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "hover:bg-gray-800 text-gray-300"
                  )}
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {item.name}
                    </div>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-8 bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 mx-4 border-t border-gray-700" />

          {/* Bottom links */}
          <div className="px-2 space-y-1">
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group relative",
                pathname === '/profile'
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-800 text-gray-300"
              )}
            >
              <UserCircle size={20} className="flex-shrink-0" />
              {!collapsed && <span>Profile</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Profile
                </div>
              )}
            </Link>
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group relative",
                pathname === '/settings'
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-800 text-gray-300"
              )}
            >
              <Settings size={20} className="flex-shrink-0" />
              {!collapsed && <span>Settings</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Settings
                </div>
              )}
            </Link>
            <Link
              href="/help"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group relative",
                pathname === '/help'
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-800 text-gray-300"
              )}
            >
              <HelpCircle size={20} className="flex-shrink-0" />
              {!collapsed && <span>Help</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Help
                </div>
              )}
            </Link>
          </div>
        </nav>

        {/* User Info & Logout - FIXED VERSION */}
        <div className="border-t border-gray-700 p-4">
          {/* User Info - Clickable Link to Profile */}
          {!collapsed ? (
            <Link 
              href="/profile" 
              className="flex items-center gap-3 mb-3 hover:bg-gray-800 rounded-lg p-2 transition-colors group"
            >
              <Avatar
                src={user?.photoURL || undefined}
                fallback={user?.displayName || user?.email?.[0] || 'U'}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </Link>
          ) : (
            /* Collapsed mode - Avatar clickable */
            <Link 
              href="/profile" 
              className="flex justify-center mb-3 group relative"
            >
              <Avatar
                src={user?.photoURL || undefined}
                fallback={user?.displayName || user?.email?.[0] || 'U'}
                size="md"
                className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              />
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Profile
              </div>
            </Link>
          )}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 text-gray-300 hover:text-white w-full px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors",
              collapsed && "justify-center"
            )}
          >
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
            {collapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Logout
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}