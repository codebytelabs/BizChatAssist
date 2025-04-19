import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { BsWhatsapp } from 'react-icons/bs';

// Types
interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  duration: number; // in minutes
  status: 'confirmed' | 'pending' | 'canceled' | 'completed';
  notes?: string;
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Sample data - in a real app this would come from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const sampleAppointments: Appointment[] = [
        {
          id: '1',
          customerName: 'Jennifer Davis',
          customerPhone: '+1 (555) 123-4567',
          service: 'Product Consultation',
          date: formatDate(today),
          time: '15:00',
          duration: 60,
          status: 'confirmed',
          notes: 'Customer interested in premium packages'
        },
        {
          id: '2',
          customerName: 'Robert Wilson',
          customerPhone: '+1 (555) 987-6543',
          service: 'Support Call',
          date: formatDate(today),
          time: '16:30',
          duration: 30,
          status: 'confirmed'
        },
        {
          id: '3',
          customerName: 'Lisa Martinez',
          customerPhone: '+1 (555) 234-5678',
          service: 'Demo Session',
          date: formatDate(tomorrow),
          time: '10:00',
          duration: 45,
          status: 'pending',
          notes: 'First-time customer, needs introduction to all services'
        },
        {
          id: '4',
          customerName: 'James Taylor',
          customerPhone: '+1 (555) 876-5432',
          service: 'Onboarding',
          date: formatDate(tomorrow),
          time: '14:00',
          duration: 90,
          status: 'confirmed'
        }
      ];
      
      // Add more sample appointments for the rest of the week
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      
      sampleAppointments.push({
        id: '5',
        customerName: 'Emily Johnson',
        customerPhone: '+1 (555) 222-3333',
        service: 'Product Consultation',
        date: formatDate(dayAfterTomorrow),
        time: '11:00',
        duration: 60,
        status: 'confirmed'
      });
      
      const thirdDay = new Date(today);
      thirdDay.setDate(thirdDay.getDate() + 3);
      
      sampleAppointments.push({
        id: '6',
        customerName: 'Michael Brown',
        customerPhone: '+1 (555) 444-5555',
        service: 'Support Call',
        date: formatDate(thirdDay),
        time: '13:30',
        duration: 45,
        status: 'pending'
      });
      
      const fourthDay = new Date(today);
      fourthDay.setDate(fourthDay.getDate() + 4);
      
      sampleAppointments.push({
        id: '7',
        customerName: 'Sarah Miller',
        customerPhone: '+1 (555) 666-7777',
        service: 'Demo Session',
        date: formatDate(fourthDay),
        time: '09:30',
        duration: 60,
        status: 'confirmed'
      });
      
      setAppointments(sampleAppointments);
      setLoading(false);
    }, 1000);
  }, []);
  
  // Helper function to format date strings
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  // Get day name
  function getDayName(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  
  // Get readable date
  function getReadableDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  // Navigate to previous week/day/month
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };
  
  // Navigate to next week/day/month
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };
  
  // Get the dates for the current week view
  const getWeekDates = (): Date[] => {
    const dates: Date[] = [];
    const startOfWeek = new Date(currentDate);
    // Adjust to start of week (Sunday)
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  // Get appointments for a specific date
  const getAppointmentsForDate = (date: string): Appointment[] => {
    return appointments.filter(appointment => appointment.date === date);
  };
  
  // Format time (24h to 12h)
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Update appointment status
  const updateAppointmentStatus = (id: string, status: 'confirmed' | 'pending' | 'canceled' | 'completed') => {
    // In a real app, this would call an API
    setAppointments(appointments.map(appointment => 
      appointment.id === id ? { ...appointment, status } : appointment
    ));
    
    if (selectedAppointment && selectedAppointment.id === id) {
      setSelectedAppointment({ ...selectedAppointment, status });
    }
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Appointments | BizChatAssist</title>
        <meta name="description" content="Manage your appointments" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Calendar Header */}
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {viewMode === 'day' 
                    ? currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                    : viewMode === 'week'
                      ? `Week of ${getWeekDates()[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${getWeekDates()[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                      : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('day')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'day' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'week' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'month' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Month
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date())}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Today
                </button>

                <div className="flex">
                  <button
                    type="button"
                    onClick={goToPrevious}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-l-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNext}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-r-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : viewMode === 'week' ? (
            <div className="flex flex-col">
              <div className="grid grid-cols-7 border-b">
                {getWeekDates().map((date, index) => (
                  <div key={index} className="py-2 border-r last:border-r-0 text-center">
                    <p className="text-xs font-medium text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className={`text-sm font-medium ${date.toDateString() === new Date().toDateString() ? 'text-indigo-600' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 min-h-[400px]">
                {getWeekDates().map((date, index) => {
                  const dateStr = formatDate(date);
                  const dayAppointments = getAppointmentsForDate(dateStr);

                  return (
                    <div 
                      key={index} 
                      className={`p-2 border-r last:border-r-0 ${date.toDateString() === new Date().toDateString() ? 'bg-indigo-50' : ''}`}
                    >
                      {dayAppointments.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                          No appointments
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {dayAppointments.map(appointment => (
                            <div 
                              key={appointment.id}
                              onClick={() => setSelectedAppointment(appointment)}
                              className={`p-2 rounded-md cursor-pointer hover:bg-gray-50 border-l-4 ${
                                appointment.status === 'confirmed' ? 'border-green-500' :
                                appointment.status === 'pending' ? 'border-yellow-500' :
                                appointment.status === 'canceled' ? 'border-red-500' :
                                'border-blue-500'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-gray-900">{formatTime(appointment.time)}</p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 truncate">{appointment.service}</p>
                              <p className="text-xs text-gray-500 truncate">{appointment.customerName}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : viewMode === 'day' ? (
            <div className="p-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>

              <div className="space-y-3">
                {getAppointmentsForDate(formatDate(currentDate)).length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    No appointments scheduled for this day
                  </div>
                ) : (
                  getAppointmentsForDate(formatDate(currentDate)).map(appointment => (
                    <div 
                      key={appointment.id}
                      onClick={() => setSelectedAppointment(appointment)}
                      className="bg-white p-4 rounded-lg shadow border-l-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                      style={{ 
                        borderLeftColor: 
                          appointment.status === 'confirmed' ? '#10B981' :
                          appointment.status === 'pending' ? '#F59E0B' :
                          appointment.status === 'canceled' ? '#EF4444' : '#3B82F6'
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatTime(appointment.time)} - {formatTime(appointment.time.split(':')[0] + ':' + (parseInt(appointment.time.split(':')[1]) + appointment.duration).toString().padStart(2, '0'))}
                            </span>
                          </div>
                          <h4 className="text-base font-medium text-gray-900 mt-1">{appointment.service}</h4>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {appointment.customerName}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {appointment.customerPhone}
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-2 text-sm text-gray-500 italic">
                          <p>{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="mt-2 text-sm">Month view coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Appointment Detail Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setSelectedAppointment(null)}></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Appointment Details
                      </h3>
                      <div className="mt-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="flex justify-between items-center">
                            <h4 className="text-base font-medium text-gray-900">{selectedAppointment.service}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                              {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-500">Date</p>
                              <p className="text-sm font-medium">
                                {new Date(selectedAppointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Time</p>
                              <p className="text-sm font-medium">{formatTime(selectedAppointment.time)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Duration</p>
                              <p className="text-sm font-medium">{selectedAppointment.duration} minutes</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-900">Customer Information</h5>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                              <p className="text-sm text-gray-600">{selectedAppointment.customerName}</p>
                            </div>
                            <div className="flex items-center">
                              <BsWhatsapp className="h-4 w-4 text-green-500 mr-2" />
                              <p className="text-sm text-gray-600">{selectedAppointment.customerPhone}</p>
                            </div>
                          </div>
                        </div>

                        {selectedAppointment.notes && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-900">Notes</h5>
                            <p className="mt-1 text-sm text-gray-600">{selectedAppointment.notes}</p>
                          </div>
                        )}

                        <div className="mt-6">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Update Status</h5>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => updateAppointmentStatus(selectedAppointment.id, 'confirmed')}
                              className={`px-3 py-1 rounded text-xs font-medium ${selectedAppointment.status === 'confirmed' ? 'bg-green-100 text-green-800 ring-2 ring-green-600' : 'bg-gray-100 text-gray-800 hover:bg-green-50'}`}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => updateAppointmentStatus(selectedAppointment.id, 'completed')}
                              className={`px-3 py-1 rounded text-xs font-medium ${selectedAppointment.status === 'completed' ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-600' : 'bg-gray-100 text-gray-800 hover:bg-blue-50'}`}
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              onClick={() => updateAppointmentStatus(selectedAppointment.id, 'canceled')}
                              className={`px-3 py-1 rounded text-xs font-medium ${selectedAppointment.status === 'canceled' ? 'bg-red-100 text-red-800 ring-2 ring-red-600' : 'bg-gray-100 text-gray-800 hover:bg-red-50'}`}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setSelectedAppointment(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
