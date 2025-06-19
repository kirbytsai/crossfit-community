// src/app/(dashboard)/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  User, 
  BarChart3, 
  Dumbbell, 
  Users, 
  Calendar,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Today\'s WOD', href: '/today', icon: Home },
    { name: 'My Page', href: '/profile', icon: User },
    { name: 'My Tracker', href: '/tracker', icon: BarChart3 },
    { name: 'My WODs', href: '/wods', icon: Dumbbell },
    { name: 'My Gym', href: '/gym', icon: Users },
    { name: 'Events', href: '/events', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-16 sm:pb-0">
      {/* Desktop Navigation */}
      <nav className="hidden sm:block bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-slate-900">CrossFit Community</h1>
              </div>
              <div className="ml-8 flex space-x-4">
                {navigation.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'text-slate-900 bg-slate-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>{user.displayName}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="sm:hidden bg-white shadow-sm border-b border-slate-200 fixed top-0 left-0 right-0 z-40">
        <div className="px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">CrossFit Community</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {user && (
              <div className="p-4 border-b border-slate-200">
                <p className="text-sm text-slate-600">Logged in as</p>
                <p className="font-medium text-slate-900">{user.displayName}</p>
              </div>
            )}

            <div className="p-4">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-slate-900 bg-slate-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={18} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {user && (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-6 w-full px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
        <div className="grid grid-cols-6 h-16">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 ${
                  isActive
                    ? 'text-slate-900'
                    : 'text-slate-500'
                }`}
              >
                <Icon 
                  size={20} 
                  className={isActive ? 'stroke-2' : 'stroke-1.5'}
                />
                <span className="text-xs mt-1 truncate max-w-full">
                  {item.name.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="sm:mt-0 mt-14">
        {children}
      </main>
    </div>
  );
}