import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  ChatBubbleLeftRightIcon, 
  ShoppingBagIcon, 
  CalendarIcon,
  UserGroupIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

// Types for dashboard data
interface DashboardStats {
  totalConversations: number;
  activeConversations: number;
  totalProducts: number;
  totalAppointments: number;
  totalCustomers: number;
  messagingStats: {
    total: number;
    previousPeriod: number;
    percentChange: number;
  };
  responseTimeStats: {
    average: string;
    previousPeriod: string;
    percentChange: number;
  };
  appointmentStats: {
    total: number;
    previousPeriod: number;
    percentChange: number;
  };
}

interface RecentConversation {
  id: string;
  customerName: string;
  phoneNumber: string;
  lastMessage: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'pending';
}

interface UpcomingAppointment {
  id: string;
  customerName: string;
  service: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'canceled';
}

export default function ClientDashboard() {
  // Sample data - in a real app this would come from an API call
  const [stats, setStats] = useState<DashboardStats>({
    totalConversations: 156,
    activeConversations: 23,
    totalProducts: 48,
    totalAppointments: 78,
    totalCustomers: 142,
    messagingStats: {
      total: 1245,
      previousPeriod: 1050,
      percentChange: 18.6
    },
    responseTimeStats: {
      average: '2m 34s',
      previousPeriod: '5m 12s',
      percentChange: -51.2
    },
    appointmentStats: {
      total: 34,
      previousPeriod: 27,
      percentChange: 25.9
    }
  });

  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([
    {
      id: '1',
      customerName: 'Sarah Johnson',
      phoneNumber: '+1 (555) 123-4567',
      lastMessage: 'Do you have this product in blue?',
      timestamp: '10 minutes ago',
      status: 'active'
    },
    {
      id: '2',
      customerName: 'Michael Smith',
      phoneNumber: '+1 (555) 987-6543',
      lastMessage: 'Thanks for the information!',
      timestamp: '35 minutes ago',
      status: 'resolved'
    },
    {
      id: '3',
      customerName: 'Emily Williams',
      phoneNumber: '+1 (555) 234-5678',
      lastMessage: 'I need to cancel my appointment.',
      timestamp: '1 hour ago',
      status: 'pending'
    },
    {
      id: '4',
      customerName: 'Daniel Brown',
      phoneNumber: '+1 (555) 876-5432',
      lastMessage: 'What are your business hours?',
      timestamp: '2 hours ago',
      status: 'active'
    }
  ]);

  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([
    {
      id: '1',
      customerName: 'Jennifer Davis',
      service: 'Product Consultation',
      date: 'Today',
      time: '3:00 PM',
      status: 'confirmed'
    },
    {
      id: '2',
      customerName: 'Robert Wilson',
      service: 'Support Call',
      date: 'Today',
      time: '4:30 PM',
      status: 'confirmed'
    },
    {
      id: '3',
      customerName: 'Lisa Martinez',
      service: 'Demo Session',
      date: 'Tomorrow',
      time: '10:00 AM',
      status: 'pending'
    },
    {
      id: '4',
      customerName: 'James Taylor',
      service: 'Onboarding',
      date: 'Tomorrow',
      time: '2:00 PM',
      status: 'confirmed'
    }
  ]);

  // In a real application, you would fetch data from your API
  useEffect(() => {
    // Example API call
    // const fetchDashboardData = async () => {
    //   try {
    //     const response = await fetch('/api/dashboard/stats', {
    //       headers: {
    //         Authorization: `Bearer ${localStorage.getItem('token')}`
    //       }
    //     });
    //     const data = await response.json();
    //     setStats(data.stats);
    //     setRecentConversations(data.recentConversations);
    //     setUpcomingAppointments(data.upcomingAppointments);
    //   } catch (error) {
    //     console.error('Error fetching dashboard data:', error);
    //   }
    // };
    // fetchDashboardData();
  }, []);

  // Helper function for status badge color
  const getConversationStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'resolved':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Dashboard | BizChatAssist</title>
        <meta name="description" content="BizChatAssist client dashboard" />
      </Head>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

        {/* Stats cards */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Conversations */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Conversations</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.totalConversations}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-2">
              <div className="text-sm">
                <Link href="/client-dashboard/conversations" className="font-medium text-indigo-600 hover:text-indigo-500">
                  View all conversations
                </Link>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingBagIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.totalProducts}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-2">
              <div className="text-sm">
                <Link href="/client-dashboard/products" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Manage products
                </Link>
              </div>
            </div>
          </div>

          {/* Appointments */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Appointments</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.totalAppointments}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-2">
              <div className="text-sm">
                <Link href="/client-dashboard/appointments" className="font-medium text-indigo-600 hover:text-indigo-500">
                  View calendar
                </Link>
              </div>
            </div>
          </div>

          {/* Customers */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.totalCustomers}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-2">
              <div className="text-sm">
                <Link href="/client-dashboard/customers" className="font-medium text-indigo-600 hover:text-indigo-500">
                  View all customers
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed stats */}
        <div className="mt-6">
          <h2 className="text-base font-medium leading-6 text-gray-900">Performance Overview</h2>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Messages stat */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-xs font-medium text-gray-500 truncate">Messages This Month</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats.messagingStats.total}</dd>
                <dd className="mt-3 flex items-center text-sm">
                  {stats.messagingStats.percentChange >= 0 ? (
                    <ArrowUpIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                  ) : (
                    <ArrowDownIcon className="flex-shrink-0 h-5 w-5 text-red-500" aria-hidden="true" />
                  )}
                  <span className={`ml-1 ${stats.messagingStats.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stats.messagingStats.percentChange).toFixed(1)}% {stats.messagingStats.percentChange >= 0 ? 'increase' : 'decrease'}
                  </span>
                  <span className="ml-1 text-gray-500">from last month</span>
                </dd>
              </div>
            </div>

            {/* Response time stat */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Average Response Time</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats.responseTimeStats.average}</dd>
                <dd className="mt-3 flex items-center text-sm">
                  {stats.responseTimeStats.percentChange <= 0 ? (
                    <ArrowDownIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                  ) : (
                    <ArrowUpIcon className="flex-shrink-0 h-5 w-5 text-red-500" aria-hidden="true" />
                  )}
                  <span className={`ml-1 ${stats.responseTimeStats.percentChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stats.responseTimeStats.percentChange).toFixed(1)}% {stats.responseTimeStats.percentChange <= 0 ? 'faster' : 'slower'}
                  </span>
                  <span className="ml-1 text-gray-500">than last month</span>
                </dd>
              </div>
            </div>

            {/* Appointments stat */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Appointments This Month</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{stats.appointmentStats.total}</dd>
                <dd className="mt-3 flex items-center text-sm">
                  {stats.appointmentStats.percentChange >= 0 ? (
                    <ArrowUpIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                  ) : (
                    <ArrowDownIcon className="flex-shrink-0 h-5 w-5 text-red-500" aria-hidden="true" />
                  )}
                  <span className={`ml-1 ${stats.appointmentStats.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stats.appointmentStats.percentChange).toFixed(1)}% {stats.appointmentStats.percentChange >= 0 ? 'increase' : 'decrease'}
                  </span>
                  <span className="ml-1 text-gray-500">from last month</span>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Recent conversations */}
        <div className="mt-6">
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-base font-medium leading-6 text-gray-900">Recent Conversations</h2>
            <Link href="/client-dashboard/conversations" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View all
            </Link>
          </div>
          <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-2.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-6">Customer</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900">Last Message</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900">Time</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentConversations.map((conversation) => (
                  <tr key={conversation.id}>
                    <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="font-medium text-gray-900">{conversation.customerName}</div>
                      <div className="text-gray-500">{conversation.phoneNumber}</div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      <div className="max-w-xs truncate">{conversation.lastMessage}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{conversation.timestamp}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getConversationStatusColor(conversation.status)}`}>
                        {conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming appointments */}
        <div className="mt-8 mb-8">
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-lg font-medium leading-6 text-gray-900">Upcoming Appointments</h2>
            <Link href="/client-dashboard/appointments" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View calendar
            </Link>
          </div>
          <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-2.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 sm:pl-6">Customer</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900">Service</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900">Date</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900">Time</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {upcomingAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{appointment.customerName}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{appointment.service}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{appointment.date}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{appointment.time}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getAppointmentStatusColor(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
