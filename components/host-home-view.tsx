'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle,
  Edit2,
  Trash2,
  MapPin,
  BedDouble,
  Bath,
  Users,
  Star,
  MoreVertical,
  Eye,
  Home,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useHostListingStore, useAuthStore, Property } from '@/lib/store';
import { listingsApi } from '@/lib/api';
import HostHeroSection from '@/components/host-hero-section';
import CreatePropertyForm from '@/components/create-property-form';
import DeletePropertyDialog from '@/components/delete-property-dialog';

export default function HostHomeView() {
  const { hostListings, addHostListing, removeHostListing, setHostListings } =
    useHostListingStore();
  const { isAuthenticated } = useAuthStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const listings = await listingsApi.getMyListings();
      setHostListings(listings);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load your listings.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, setHostListings]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

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

  return (
    <>
      {/* Host Hero */}
      <HostHeroSection
        onCreateProperty={() => setIsCreateOpen(true)}
        listingCount={hostListings.length}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-foreground">
              Your Properties
            </h2>
            <p className="text-muted-foreground mt-2">
              {isLoading
                ? 'Loading your listings...'
                : hostListings.length === 0
                ? 'You have no listings yet. Create your first one!'
                : `${hostListings.length} ${hostListings.length === 1 ? 'property' : 'properties'} listed`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchListings}
              disabled={isLoading}
              className="p-2.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title="Refresh listings"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            {hostListings.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreateOpen(true)}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <PlusCircle size={18} />
                Add Property
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Error Banner */}
        {fetchError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between"
          >
            <span>{fetchError}</span>
            <button
              onClick={fetchListings}
              className="ml-4 px-3 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Not authenticated banner */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm"
          >
            You need to log in to create and manage your listings.
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && hostListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your properties...</p>
          </div>
        ) : hostListings.length > 0 ? (
          /* Properties Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <HostPropertyCard
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
              className="min-h-[380px] rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-card/50 flex flex-col items-center justify-center gap-4 transition-all group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <PlusCircle size={28} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-lg">Add New Property</p>
                <p className="text-sm text-muted-foreground mt-1">
                  List a new space for travelers
                </p>
              </div>
            </motion.button>
          </div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Home size={40} className="text-accent" />
            </div>
            <h3 className="font-playfair text-2xl font-bold text-foreground mb-3">
              No Properties Yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Start hosting by creating your first property listing. Share your unique space with
              travelers from around the world.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-accent-foreground rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <PlusCircle size={22} />
              Create Your First Listing
            </motion.button>
          </motion.div>
        )}

        {/* Tips Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-24 py-16 border-t border-border"
        >
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-foreground mb-4">
              Hosting Tips
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Make the most out of your hosting experience on WanderLeaf
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '📸',
                title: 'Great Photos',
                description:
                  'High-quality photos are the #1 factor in attracting guests. Use natural lighting and showcase unique features.',
              },
              {
                icon: '💬',
                title: 'Fast Responses',
                description:
                  'Guests appreciate quick replies. Aim to respond within an hour to boost your ranking and reviews.',
              },
              {
                icon: '🏷️',
                title: 'Competitive Pricing',
                description:
                  'Research similar listings in your area. Start with a competitive price and adjust based on demand.',
              },
            ].map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-elegant p-8 text-center"
              >
                <div className="text-4xl mb-4">{tip.icon}</div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{tip.title}</h3>
                <p className="text-muted-foreground">{tip.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
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
    </>
  );
}

/* ─── Host Property Card ─── */

function HostPropertyCard({
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
      {/* Image */}
      <div className="relative w-full aspect-video overflow-hidden bg-muted group">
        <Image
          src={property.images[0]}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white shadow-sm">
            Active
          </span>
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-3 left-3 bg-foreground/90 backdrop-blur-sm text-primary-foreground px-3 py-1 rounded-full">
          <span className="font-semibold">₹{property.price}</span>
          <span className="text-xs opacity-90">/night</span>
        </div>

        {/* Actions Menu */}
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

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Location */}
        <div className="flex items-start gap-2 mb-2">
          <MapPin size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground truncate">{property.location}</p>
        </div>

        {/* Title */}
        <h3 className="font-playfair font-semibold text-lg mb-3 line-clamp-2 text-foreground">
          {property.title}
        </h3>

        {/* Stats Row */}
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

        {/* Amenities Preview */}
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

        {/* Bottom Row */}
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
