'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  DollarSign,
  BedDouble,
  Bath,
  Users,
  ArrowLeft,
  Loader2,
  Save,
  Upload,
  Trash2,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { listingsApi, CreateListingPayload } from '@/lib/api';
import { useAuthStore, useHostListingStore, Property } from '@/lib/store';
import { amenitiesList, categories } from '@/lib/mock-data';

const MAX_FILES = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type ImageItem = {
  type: 'existing';
  url: string;
} | {
  type: 'new';
  file: File;
  preview: string;
}

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateHostListing = useHostListingStore((s) => s.updateHostListing);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [guests, setGuests] = useState('2');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!propertyId) return;
    setIsLoading(true);
    setError(null);
    listingsApi
      .getById(propertyId)
      .then((p) => {
        if (isAuthenticated && user && user.id !== p.host.id) {
          setError('You do not have permission to edit this property.');
          return;
        }
        setTitle(p.title);
        setDescription(p.description);
        setLocation(p.location);
        setPrice(String(p.price));
        setBedrooms(String(p.bedrooms));
        setBathrooms(String(p.bathrooms));
        setGuests(String(p.guests));
        setSelectedAmenities(p.amenities);
        setImages(p.images.map((url) => ({ type: 'existing' as const, url })));
      })
      .catch((err) => setError(err.message || 'Failed to load property.'))
      .finally(() => setIsLoading(false));
  }, [propertyId, isAuthenticated, user]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const remaining = MAX_FILES - images.length;
      const newItems: ImageItem[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        if (!ACCEPTED_TYPES.includes(file.type)) continue;
        if (file.size > MAX_FILE_SIZE) continue;
        newItems.push({ type: 'new', file, preview: URL.createObjectURL(file) });
      }
      if (newItems.length > 0) {
        setImages((prev) => [...prev, ...newItems]);
      }
    },
    [images.length]
  );

  const removeImage = (index: number) => {
    setImages((prev) => {
      const item = prev[index];
      if (item.type === 'new') URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!location.trim()) errs.location = 'Location is required';
    if (!price || Number(price) <= 0) errs.price = 'Enter a valid price';
    if (images.length === 0) errs.images = 'At least one image is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    setUploadProgress(0);

    try {
      const newFiles = images.filter((i): i is Extract<ImageItem, { type: 'new' }> => i.type === 'new');
      const existingUrls = images.filter((i): i is Extract<ImageItem, { type: 'existing' }> => i.type === 'existing').map((i) => i.url);

      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        const res = await listingsApi.uploadImages(
          newFiles.map((f) => f.file),
          (p) => setUploadProgress(p)
        );
        uploadedUrls = res.urls;
      }

      const allImageUrls = [...existingUrls, ...uploadedUrls];

      const payload: Partial<CreateListingPayload> = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        category: category || undefined,
        price_per_night: Number(price).toFixed(2),
        bedrooms: Number(bedrooms),
        bathrooms: bathrooms,
        max_guests: Number(guests),
        amenities: selectedAmenities,
        images: allImageUrls,
      };

      const updated = await listingsApi.update(propertyId, payload);
      updateHostListing(propertyId, updated);
      setSaveSuccess(true);

      setTimeout(() => {
        router.push(`/property/${propertyId}`);
      }, 1000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-muted-foreground">Loading property...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{error}</h1>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft size={16} />
            Go back
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-playfair text-3xl md:text-4xl font-bold text-foreground mb-2">
            Edit Property
          </h1>
          <p className="text-muted-foreground mb-8">
            Update the details of your listing
          </p>
        </motion.div>

        {/* Success banner */}
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-sm flex items-center gap-2"
          >
            <Check size={16} />
            Changes saved successfully! Redirecting...
          </motion.div>
        )}

        {/* Error banner */}
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm"
          >
            {saveError}
          </motion.div>
        )}

        <div className="space-y-10">
          {/* ── Basic Info ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elegant p-6 rounded-xl space-y-5"
          >
            <h2 className="font-semibold text-lg text-foreground">Basic Information</h2>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Property Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.title; return n; }); }}
                className={fieldErrors.title ? 'border-destructive' : ''}
              />
              {fieldErrors.title && <p className="text-xs text-destructive">{fieldErrors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                rows={5}
                value={description}
                onChange={(e) => { setDescription(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.description; return n; }); }}
                className={fieldErrors.description ? 'border-destructive' : ''}
              />
              {fieldErrors.description && <p className="text-xs text-destructive">{fieldErrors.description}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-muted-foreground" />Location</span>
                </Label>
                <Input
                  id="edit-location"
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.location; return n; }); }}
                  className={fieldErrors.location ? 'border-destructive' : ''}
                />
                {fieldErrors.location && <p className="text-xs text-destructive">{fieldErrors.location}</p>}
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.section>

          {/* ── Details ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-elegant p-6 rounded-xl space-y-5"
          >
            <h2 className="font-semibold text-lg text-foreground">Property Details</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>
                  <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-muted-foreground" />Price / Night</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => { setPrice(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.price; return n; }); }}
                  className={fieldErrors.price ? 'border-destructive' : ''}
                />
                {fieldErrors.price && <p className="text-xs text-destructive">{fieldErrors.price}</p>}
              </div>
              <div className="space-y-2">
                <Label><span className="flex items-center gap-1.5"><BedDouble size={14} className="text-muted-foreground" />Bedrooms</span></Label>
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label><span className="flex items-center gap-1.5"><Bath size={14} className="text-muted-foreground" />Bathrooms</span></Label>
                <Select value={bathrooms} onValueChange={setBathrooms}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['1', '1.5', '2', '2.5', '3', '3.5', '4'].map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label><span className="flex items-center gap-1.5"><Users size={14} className="text-muted-foreground" />Max Guests</span></Label>
                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.section>

          {/* ── Amenities ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-elegant p-6 rounded-xl space-y-4"
          >
            <div>
              <h2 className="font-semibold text-lg text-foreground">Amenities</h2>
              <p className="text-xs text-muted-foreground mt-1">{selectedAmenities.length} selected</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {amenitiesList.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all text-left ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-card border-border text-foreground hover:border-primary/50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isSelected && <Check size={14} />}
                      {amenity}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.section>

          {/* ── Images ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card-elegant p-6 rounded-xl space-y-5"
          >
            <div>
              <h2 className="font-semibold text-lg text-foreground">Images</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {images.length}/{MAX_FILES} images &mdash; drag to reorder is not yet supported, remove and re-add to change order
              </p>
            </div>

            {fieldErrors.images && <p className="text-xs text-destructive">{fieldErrors.images}</p>}

            {/* Existing + new previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div
                    key={img.type === 'existing' ? img.url : img.preview}
                    className="relative group aspect-video rounded-lg overflow-hidden bg-muted border border-border"
                  >
                    {img.type === 'existing' ? (
                      <Image src={img.url} alt={`Image ${index + 1}`} fill className="object-cover" />
                    ) : (
                      <img src={img.preview} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                    )}
                    {index === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary text-primary-foreground uppercase tracking-wide">
                        Cover
                      </span>
                    )}
                    {img.type === 'new' && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-medium bg-accent text-accent-foreground">
                        New
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-foreground/70 text-background opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload zone */}
            {images.length < MAX_FILES && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 bg-card/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload size={22} className={isDragging ? 'text-primary' : 'text-muted-foreground'} />
                  <p className="text-sm text-muted-foreground">
                    {isDragging ? 'Drop images here' : 'Drag & drop or click to add more images'}
                  </p>
                </div>
              </div>
            )}
          </motion.section>

          {/* ── Save bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="sticky bottom-4 z-10"
          >
            <div className="card-elegant p-4 rounded-xl flex items-center justify-between gap-4 shadow-lg border border-border">
              <button
                onClick={() => router.back()}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                {isSaving && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    {uploadProgress}%
                  </div>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-70"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {uploadProgress < 100 && uploadProgress > 0 ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
