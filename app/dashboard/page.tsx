'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MapPin, Calendar, Clock, X, Edit2, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockProperties } from '@/lib/mock-data';
import { useAuthStore } from '@/lib/store';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('trips');
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    // Clear auth store
    logout();
    // Clear any persisted auth
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('wanderleaf_auth');
    }
    // Redirect to login page
    router.push('/auth/login');
  };

  // Fallback mock user for now until dashboard is fully wired to backend auth
  const user = authUser ?? {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    joinDate: 'Joined January 2023',
    verified: true,
  };

  // Mock bookings data
  const bookings = [
    {
      id: 'b1',
      propertyId: '1',
      checkIn: '2024-03-15',
      checkOut: '2024-03-20',
      status: 'confirmed',
      totalPrice: 925,
      property: mockProperties[0],
    },
    {
      id: 'b2',
      propertyId: '2',
      checkIn: '2024-04-10',
      checkOut: '2024-04-17',
      status: 'pending',
      totalPrice: 1715,
      property: mockProperties[1],
    },
  ];

  // Mock saved properties
  const savedProperties = mockProperties.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-playfair text-4xl font-bold text-foreground">Account</h1>
          <p className="text-muted-foreground mt-2">Manage your bookings, saved places, and profile</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elegant p-6 md:p-8 mb-8"
        >
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-6">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover"
              />
              <div className="flex-1">
                <h2 className="font-playfair text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {user.name}
                </h2>
                <p className="text-muted-foreground mb-2">{user.email}</p>
                <p className="text-sm text-muted-foreground mb-4">{user.joinDate}</p>
                {user.verified && (
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    Verified Guest
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Edit2 size={18} />
                <span className="hidden sm:inline">Edit Profile</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors flex items-center gap-2"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-secondary p-1 rounded-lg mb-8">
              <TabsTrigger value="trips" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Trips
              </TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Bookings
              </TabsTrigger>
              <TabsTrigger value="saved" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Saved
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Payments
              </TabsTrigger>
            </TabsList>

            {/* Trips Tab */}
            <TabsContent value="trips" className="space-y-4">
              <div className="space-y-4">
                {bookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card-elegant overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row gap-6 p-6">
                      {/* Image */}
                      <div className="w-full sm:w-48 h-40 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={booking.property.images[0]}
                          alt={booking.property.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-playfair font-bold text-lg text-foreground mb-2">
                            {booking.property.title}
                          </h3>
                          <p className="text-muted-foreground flex items-center gap-2 mb-2">
                            <MapPin size={16} />
                            {booking.property.location}
                          </p>

                          {/* Dates */}
                          <div className="flex flex-col sm:flex-row gap-4 text-sm text-foreground mb-4">
                            <span className="flex items-center gap-2">
                              <Calendar size={16} />
                              Check-in: {new Date(booking.checkIn).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-2">
                              <Calendar size={16} />
                              Check-out: {new Date(booking.checkOut).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-muted-foreground text-sm">Total Paid</p>
                            <p className="text-2xl font-bold text-primary">${booking.totalPrice}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4">
              <div className="card-elegant p-6">
                <h3 className="font-semibold text-foreground mb-4">Upcoming & Past Bookings</h3>
                <div className="space-y-3">
                  {bookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">{booking.property.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Saved Tab */}
            <TabsContent value="saved" className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card-elegant overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  >
                    <div className="relative w-full aspect-video overflow-hidden bg-muted">
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors">
                        <Heart size={20} className="fill-accent text-accent" />
                      </button>
                    </div>

                    <div className="p-4">
                      <h3 className="font-playfair font-semibold text-lg text-foreground mb-2">
                        {property.title}
                      </h3>
                      <p className="text-muted-foreground text-sm flex items-center gap-2 mb-3">
                        <MapPin size={14} />
                        {property.location}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground text-sm">Price per night</p>
                          <p className="text-2xl font-bold text-primary">${property.price}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-sm">Rating</p>
                          <p className="text-lg font-semibold text-foreground">{property.rating}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              <div className="card-elegant p-6">
                <h3 className="font-semibold text-foreground mb-6">Payment Methods</h3>
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 border border-border rounded-lg flex items-center justify-between hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">Visa ending in 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                    </div>
                    <button className="text-primary hover:underline">Edit</button>
                  </motion.div>
                  <button className="w-full py-3 border-2 border-dashed border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors">
                    + Add Payment Method
                  </button>
                </div>

                {/* Billing History */}
                <div className="mt-8 pt-8 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-4">Billing History</h4>
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div>
                          <p className="text-foreground font-medium">{booking.property.title}</p>
                          <p className="text-sm text-muted-foreground">{new Date(booking.checkIn).toLocaleDateString()}</p>
                        </div>
                        <p className="font-semibold text-foreground">${booking.totalPrice}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
