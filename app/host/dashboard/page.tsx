'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import RequireAuth from '@/components/require-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, IndianRupee, Calendar, PlusCircle, Edit2, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { bookingsApi, listingsApi, type ApiBooking } from '@/lib/api';
import { Property } from '@/lib/store';

export default function HostDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [hostProperties, setHostProperties] = useState<Property[]>([]);
  const [hostBookings, setHostBookings] = useState<ApiBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listings, bookingsResponse] = await Promise.all([
        listingsApi.getMyListings(),
        bookingsApi.listForHost(),
      ]);
      const bookings = Array.isArray(bookingsResponse)
        ? bookingsResponse
        : bookingsResponse.results;

      setHostProperties(listings);
      setHostBookings(bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const totalEarnings = hostBookings.reduce(
    (sum, booking) => sum + Number(booking.total_price || 0),
    0
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);

  const analytics = {
    totalEarnings,
    totalBookings: hostBookings.length,
    totalGuests: hostBookings.reduce((sum, booking) => sum + booking.num_guests, 0),
    occupancyRate: 0,
  };

  const upcomingBookings: {
    id: string;
    guestName: string;
    property: string;
    checkIn: string;
    checkOut: string;
    status: string;
  }[] = [];

  return (
    <RequireAuth>
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h1 className="font-playfair text-4xl font-bold text-foreground">Hosting Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your properties and bookings</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            <PlusCircle size={20} />
            Add New Property
          </motion.button>
        </motion.div>

        {/* Analytics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-4 gap-6 mb-12"
        >
          {[
            {
              icon: IndianRupee,
              label: 'Total Earnings',
              value: `₹${formatCurrency(analytics.totalEarnings)}`,
              color: 'text-green-600',
              bgColor: 'bg-green-50',
            },
            {
              icon: Calendar,
              label: 'Total Bookings',
              value: analytics.totalBookings,
              color: 'text-blue-600',
              bgColor: 'bg-blue-50',
            },
            {
              icon: Users,
              label: 'Total Guests',
              value: analytics.totalGuests,
              color: 'text-purple-600',
              bgColor: 'bg-purple-50',
            },
            {
              icon: BarChart3,
              label: 'Occupancy Rate',
              value: `${analytics.occupancyRate}%`,
              color: 'text-orange-600',
              bgColor: 'bg-orange-50',
            },
          ].map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`${card.bgColor} card-elegant p-6 rounded-xl`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">{card.label}</p>
                    <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                  <Icon className={`${card.color}`} size={24} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-secondary p-1 rounded-lg mb-8">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Overview
              </TabsTrigger>
              <TabsTrigger value="properties" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Properties
              </TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Bookings
              </TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Calendar
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Upcoming Bookings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-elegant p-6 rounded-xl"
              >
                <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Upcoming Bookings</h2>
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking, index) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{booking.guestName}</p>
                          <p className="text-sm text-muted-foreground">{booking.property}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No upcoming bookings yet.</p>
                )}
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card-elegant p-6 rounded-xl"
              >
                <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Recent Activity</h2>
                <div className="space-y-3">
                  {[
                    { event: 'New booking from Sarah', time: '2 hours ago' },
                    { event: 'Guest Emily left a 5-star review', time: '5 hours ago' },
                    { event: 'Property visibility updated', time: '1 day ago' },
                    { event: 'Earnings processed', time: '2 days ago' },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="flex items-center gap-4 p-3 border border-border rounded-lg"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-foreground">{item.event}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </TabsContent>

            {/* Properties Tab */}
            <TabsContent value="properties" className="space-y-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading your properties...</p>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <button
                    onClick={fetchDashboardData}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Try Again
                  </button>
                </div>
              ) : hostProperties.length === 0 ? (
                <div className="text-center py-16">
                  <PlusCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-playfair text-xl font-bold text-foreground mb-2">No Properties Yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Start hosting by creating your first property listing.
                  </p>
                </div>
              ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hostProperties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card-elegant overflow-hidden rounded-xl"
                  >
                    {/* Image */}
                    <div className="relative w-full aspect-video overflow-hidden bg-muted group">
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors">
                          <Eye size={18} className="text-foreground" />
                        </button>
                        <button className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors">
                          <EyeOff size={18} className="text-foreground" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-playfair font-bold text-lg text-foreground mb-1 line-clamp-2">
                        {property.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {property.bedrooms} bed • {property.bathrooms} bath • {property.guests} guests
                      </p>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-4 py-4 border-t border-b border-border">
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Rating</p>
                          <p className="font-semibold text-foreground">{property.rating}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Reviews</p>
                          <p className="font-semibold text-foreground">{property.reviews}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Price/Night</p>
                          <p className="font-semibold text-primary">₹{property.price}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button className="px-3 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              )}
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4">
              <div className="card-elegant p-6 rounded-xl">
                <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">All Bookings</h2>
                {upcomingBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Guest</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Property</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Dates</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingBookings.map((booking, index) => (
                          <motion.tr
                            key={booking.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-border hover:bg-muted transition-colors"
                          >
                            <td className="py-3 px-4 text-foreground">{booking.guestName}</td>
                            <td className="py-3 px-4 text-foreground">{booking.property}</td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button className="text-primary hover:underline font-medium">View</button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No bookings yet.</p>
                )}
              </div>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-4">
              <div className="card-elegant p-8 rounded-xl text-center">
                <Calendar size={48} className="mx-auto text-muted mb-4" />
                <h2 className="font-playfair text-2xl font-bold text-foreground mb-2">Property Calendar</h2>
                <p className="text-muted-foreground mb-6">View and manage availability for all your properties</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors inline-block"
                >
                  Open Calendar
                </motion.button>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Footer />
    </div>
    </RequireAuth>
  );
}
