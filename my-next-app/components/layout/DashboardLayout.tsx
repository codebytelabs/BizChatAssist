import { ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  CalendarIcon,
  Cog6ToothIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: (props: React.ComponentProps<'svg'>) => React.ReactNode;
  current: boolean;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/client-dashboard', icon: HomeIcon, current: router.pathname === '/client-dashboard' },
    { name: 'Conversations', href: '/client-dashboard/conversations', icon: ChatBubbleLeftRightIcon, current: router.pathname.includes('/conversations') },
    { name: 'Products & Services', href: '/client-dashboard/products', icon: ShoppingBagIcon, current: router.pathname.includes('/products') },
    { name: 'Appointments', href: '/client-dashboard/appointments', icon: CalendarIcon, current: router.pathname.includes('/appointments') },
    { name: 'Analytics', href: '/client-dashboard/analytics', icon: ChartBarIcon, current: router.pathname.includes('/analytics') },
    { name: 'Customers', href: '/client-dashboard/customers', icon: UsersIcon, current: router.pathname.includes('/customers') },
    { name: 'Settings', href: '/client-dashboard/settings', icon: Cog6ToothIcon, current: router.pathname.includes('/settings') },
  ];

  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    // Redirect to login page
    router.push('/login');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-indigo-700">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          
          <div className="flex-shrink-0 flex items-center px-4">
            <span className="text-lg font-bold text-white">BizChatAssist</span>
          </div>
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-0.5">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-1.5 text-sm font-medium rounded-md ${
                    item.current ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-600'
                  }`}
                >
                  <item.icon className="mr-4 h-6 w-6 text-indigo-300" aria-hidden="true" />
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full group flex items-center px-2 py-2 text-base font-medium rounded-md text-indigo-100 hover:bg-indigo-600"
              >
                <ArrowLeftOnRectangleIcon className="mr-4 h-6 w-6 text-indigo-300" aria-hidden="true" />
                Logout
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 bg-indigo-800">
            <div className="flex items-center h-14 flex-shrink-0 px-4 bg-indigo-900">
              <span className="text-xl font-bold text-white">BizChatAssist</span>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-1.5 text-sm font-medium rounded-md ${
                      item.current ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-600'
                    }`}
                  >
                    <div className="mr-2 h-5 w-5 text-indigo-300" aria-hidden="true">
                      <item.icon />
                    </div>
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-indigo-100 hover:bg-indigo-600"
                >
                  <div className="mr-2 h-5 w-5 text-indigo-300" aria-hidden="true">
                    <ArrowLeftOnRectangleIcon />
                  </div>
                  Logout
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              {/* Search bar could go here */}
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Profile dropdown could go here */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white font-medium">JD</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
