'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import CreatePropertyForm from '@/components/create-property-form';
import DeletePropertyDialog from '@/components/delete-property-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heart,
  MapPin,
  Calendar,
  Edit2,
  LogOut,
  Home,
  PlusCircle,
  Loader2,
  RefreshCw,
  Trash2,
  BedDouble,
  Bath,
  Users,
  Star,
  MoreVertical,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useHostListingStore, usePropertyStore, Property } from '@/lib/store';
import RequireAuth from '@/components/require-auth';
import { listingsApi, wishlistApi, bookingsApi, type ApiBooking } from '@/lib/api';
import PropertyCard from '@/components/property-card';
import { getAvatarUrl } from '@/lib/avatar';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam && ['properties', 'trips', 'bookings', 'saved', 'payments'].includes(tabParam)
      ? tabParam
      : 'properties'
  );
  const router = useRouter();

  useEffect(() => {
    if (tabParam && ['properties', 'trips', 'bookings', 'saved', 'payments'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const { hostListings, addHostListing, removeHostListing, setHostListings } =
    useHostListingStore();
  const favorites = usePropertyStore((s) => s.favorites);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<{
    id: string;
    propertyId: string;
    checkIn: string;
    checkOut: string;
    status: string;
    totalPrice: number;
    property: Property;
  }[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('wanderleaf_auth');
    }
    router.push('/auth/login');
  };

  const fetchListings = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingListings(true);
    setListingsError(null);
    try {
      const listings = await listingsApi.getMyListings();
      setHostListings(listings);
    } catch (err: any) {
      setListingsError(err.message || 'Failed to load your listings.');
    } finally {
      setIsLoadingListings(false);
    }
  }, [isAuthenticated, setHostListings]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const fetchSavedProperties = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingSaved(true);
    try {
      const list = await wishlistApi.list();
      setSavedProperties(list);
    } catch {
      setSavedProperties([]);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'saved') fetchSavedProperties();
  }, [activeTab, fetchSavedProperties]);

  const fetchBookings = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingBookings(true);
    try {
      const data = await bookingsApi.list();
      const list = Array.isArray(data) ? data : (data as { results: ApiBooking[] }).results;
      const mapped = list.map((b: ApiBooking) => ({
        id: b.id,
        propertyId: b.listing.id,
        checkIn: b.check_in,
        checkOut: b.check_out,
        status:
          b.status === 'confirmed' || b.status === 'completed'
            ? 'confirmed'
            : b.status === 'pending_payment'
              ? 'pending'
              : b.status.includes('cancelled') || b.status === 'refunded'
                ? 'cancelled'
                : b.status,
        totalPrice: Number(b.total_price),
        property: {
          id: b.listing.id,
          title: b.listing.title,
          description: '',
          location: b.listing.location,
          coordinates: { lat: 0, lng: 0 },
          price: Number(b.listing.price_per_night),
          rating: 0,
          reviews: 0,
          images: b.listing.images,
          amenities: [],
          bedrooms: 0,
          bathrooms: 0,
          guests: b.num_guests,
          host: { id: '', name: '', rating: 0, isVerified: false },
          createdAt: '',
        } as Property,
      }));
      setBookings(mapped);
    } catch {
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCreateProperty = (property: Property) => {
    addHostListing(property);
  };

  const requestDelete = (id: string, title: string) => {
    setDeleteConfirm({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    setDeletingId(id);
    setDeleteConfirm(null);
    try {
      await listingsApi.remove(id);
      setTimeout(() => {
        removeHostListing(id);
        setDeletingId(null);
      }, 300);
    } catch {
      setDeletingId(null);
    }
  };

  const user = authUser ?? {
    name: 'Guest User',
    email: 'guest@example.com',
    avatar: null,
    joinDate: 'Joined WanderLeaf',
    verified: false,
  };

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
    <RequireAuth>
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
          <p className="text-muted-foreground mt-2">Manage your properties, bookings, saved places, and profile</p>
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
                src={getAvatarUrl(user.avatar, user.name)}
                alt={user.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover"
              />
              <div className="flex-1">
                <h2 className="font-playfair text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {user.name}
                </h2>
                <p className="text-muted-foreground mb-2">{user.email}</p>
                {(user as any).joinDate && (
                  <p className="text-sm text-muted-foreground mb-4">{(user as any).joinDate}</p>
                )}
                {(user as any).verified && (
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
                onClick={() => router.push('/dashboard/profile')}
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
            <TabsList className="grid w-full grid-cols-5 bg-secondary p-1 rounded-lg mb-8">
              <TabsTrigger value="properties" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                Properties
              </TabsTrigger>
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

            {/* ── My Properties Tab ── */}
            <TabsContent value="properties" className="space-y-6">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">My Properties</h3>
                  <p className="text-sm text-muted-foreground">
                    {isLoadingListings
                      ? 'Loading...'
                      : `${hostListings.length} ${hostListings.length === 1 ? 'property' : 'properties'} listed`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchListings}
                    disabled={isLoadingListings}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw size={16} className={isLoadingListings ? 'animate-spin' : ''} />
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors"
                  >
                    <PlusCircle size={16} />
                    New Property
                  </motion.button>
                </div>
              </div>

              {/* Error banner */}
              {listingsError && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between">
                  <span>{listingsError}</span>
                  <button
                    onClick={fetchListings}
                    className="ml-4 px-3 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Loading */}
              {isLoadingListings && hostListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading your properties...</p>
                </div>
              ) : hostListings.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {hostListings.map((property, index) => (
                      <motion.div
                        key={property.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: deletingId === property.id ? 0 : 1,
                          y: 0,
                          scale: deletingId === property.id ? 0.9 : 1,
                        }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        className="h-full"
                      >
                        <DashboardPropertyCard
                          property={property}
                          onDelete={() => requestDelete(property.id, property.title)}
                          isDeleting={deletingId === property.id}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Add New Card */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: hostListings.length * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsCreateOpen(true)}
                    className="min-h-[320px] rounded-xl border-2 border-dashed border-border hover:border-accent/50 bg-card/50 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <PlusCircle size={24} className="text-accent" />
                    </div>
                    <p className="font-semibold text-foreground">Add New Property</p>
                    <p className="text-sm text-muted-foreground">List a new space for travelers</p>
                  </motion.button>
                </div>
              ) : (
                /* Empty state */
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
                    <Home size={36} className="text-accent" />
                  </div>
                  <h3 className="font-playfair text-xl font-bold text-foreground mb-2">
                    No Properties Yet
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Start hosting by creating your first property listing.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreateOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <PlusCircle size={20} />
                    Create Your First Listing
                  </motion.button>
                </div>
              )}
            </TabsContent>

            {/* ── Trips Tab ── */}
            <TabsContent value="trips" className="space-y-4">
              {isLoadingBookings ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading your trips...</p>
                </div>
              ) : bookings.length > 0 ? (
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
                        <div className="w-full sm:w-48 h-40 rounded-lg overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                          {booking.property.images[0] ? (
                            <img
                              src={booking.property.images[0]}
                              alt={booking.property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Home className="w-12 h-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-playfair font-bold text-lg text-foreground mb-2">
                              {booking.property.title}
                            </h3>
                            <p className="text-muted-foreground flex items-center gap-2 mb-2">
                              <MapPin size={16} />
                              {booking.property.location}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 text-sm text-foreground mb-4">
                              <span className="flex items-center gap-2">
                                <Calendar size={16} />
                                Check-in: {formatDate(booking.checkIn)}
                              </span>
                              <span className="flex items-center gap-2">
                                <Calendar size={16} />
                                Check-out: {formatDate(booking.checkOut)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-muted-foreground text-sm">Total Paid</p>
                              <p className="text-2xl font-bold text-primary">${booking.totalPrice}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusText(booking.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Calendar size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-playfair text-xl font-bold text-foreground mb-2">No Trips Yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    When you book a stay, your trips will appear here.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* ── Bookings Tab ── */}
            <TabsContent value="bookings" className="space-y-4">
              <div className="card-elegant p-6">
                <h3 className="font-semibold text-foreground mb-4">Upcoming & Past Bookings</h3>
                {isLoadingBookings ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 size={24} className="animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                  </div>
                ) : bookings.length > 0 ? (
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
                            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No bookings yet.</p>
                )}
              </div>
            </TabsContent>

            {/* ── Saved Tab ── */}
            <TabsContent value="saved" className="space-y-4">
              {isLoadingSaved ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading your saved properties...</p>
                </div>
              ) : savedProperties.filter((p) => favorites.includes(p.id)).length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedProperties
                    .filter((p) => favorites.includes(p.id))
                    .map((property, index) => (
                      <PropertyCard key={property.id} property={property} index={index} />
                    ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Heart size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-playfair text-xl font-bold text-foreground mb-2">No Saved Properties</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Click the heart on any property to save it here for easy access.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* ── Payments Tab ── */}
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

                <div className="mt-8 pt-8 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-4">Billing History</h4>
                  {bookings.length > 0 ? (
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
                            <p className="text-sm text-muted-foreground">{formatDate(booking.checkIn)}</p>
                          </div>
                          <p className="font-semibold text-foreground">${booking.totalPrice}</p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No billing history yet.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Create Property Dialog */}
      <CreatePropertyForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateProperty}
      />

      {/* Delete Confirmation Dialog */}
      <DeletePropertyDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}
        propertyTitle={deleteConfirm?.title ?? ''}
        isDeleting={!!deletingId}
        onConfirm={handleConfirmDelete}
      />

      <Footer />
    </div>
    </RequireAuth>
  );
}

/* ─── Dashboard Property Card ─── */

function DashboardPropertyCard({
  property,
  onDelete,
  isDeleting,
}: {
  property: Property;
  onDelete: () => void;
  isDeleting?: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const router = useRouter();

  return (
    <div
      className="card-elegant overflow-hidden h-full flex flex-col cursor-pointer"
      onClick={() => router.push(`/property/${property.id}`)}
    >
      <div className="relative w-full aspect-video overflow-hidden bg-muted group">
        <Image
          src={property.images[0]}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white shadow-sm">
            Active
          </span>
        </div>
        <div className="absolute bottom-3 left-3 bg-foreground/90 backdrop-blur-sm text-primary-foreground px-3 py-1 rounded-full">
          <span className="font-semibold">${property.price}</span>
          <span className="text-xs opacity-90">/night</span>
        </div>
        <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
            >
              <MoreVertical size={18} className="text-foreground" />
            </button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg py-2 min-w-[140px] z-20"
                >
                  <button
                    onClick={() => { setShowActions(false); router.push(`/property/${property.id}`); }}
                    className="w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2 text-left"
                  >
                    <Eye size={14} />
                    View
                  </button>
                  <button
                    onClick={() => { setShowActions(false); router.push(`/property/${property.id}/edit`); }}
                    className="w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2 text-left"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowActions(false);
                      onDelete();
                    }}
                    disabled={isDeleting}
                    className="w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2 text-left disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start gap-2 mb-2">
          <MapPin size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground truncate">{property.location}</p>
        </div>
        <h3 className="font-playfair font-semibold text-lg mb-3 line-clamp-2 text-foreground">
          {property.title}
        </h3>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <BedDouble size={14} /> {property.bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <Bath size={14} /> {property.bathrooms}
          </span>
          <span className="flex items-center gap-1">
            <Users size={14} /> {property.guests}
          </span>
        </div>
        {property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {property.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
              >
                {amenity}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                +{property.amenities.length - 3}
              </span>
            )}
          </div>
        )}
        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1">
            {property.rating > 0 ? (
              <>
                <Star size={14} className="fill-accent text-accent" />
                <span className="text-sm font-medium text-foreground">{property.rating}</span>
                <span className="text-xs text-muted-foreground">({property.reviews})</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground italic">No reviews yet</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            Listed {new Date(property.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
