'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  ImagePlus,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  X,
  Loader2,
  Upload,
  Trash2,
} from 'lucide-react';
import { Property } from '@/lib/store';
import { listingsApi, CreateListingPayload } from '@/lib/api';
import { amenitiesList, categories } from '@/lib/constants';

interface CreatePropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (property: Property) => void;
}

interface ImageFile {
  file: File;
  preview: string;
}

const STEPS = [
  { id: 1, label: 'Basics', icon: Sparkles },
  { id: 2, label: 'Details', icon: BedDouble },
  { id: 3, label: 'Amenities', icon: Check },
  { id: 4, label: 'Images', icon: ImagePlus },
];

const MAX_FILES = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function CreatePropertyForm({
  open,
  onOpenChange,
  onSubmit,
}: CreatePropertyFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    price: '',
    bedrooms: '1',
    bathrooms: '1',
    guests: '2',
    amenities: [] as string[],
  });
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setStep(1);
    setIsSubmitting(false);
    setUploadProgress(0);
    setSubmitError(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      category: '',
      price: '',
      bedrooms: '1',
      bathrooms: '1',
      guests: '2',
      amenities: [],
    });
    imageFiles.forEach((img) => URL.revokeObjectURL(img.preview));
    setImageFiles([]);
    setIsDragging(false);
    setErrors({});
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const updateField = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setSubmitError(null);
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  /* ─── Image handling ─── */

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newFiles: ImageFile[] = [];
      const fileArray = Array.from(files);
      const remaining = MAX_FILES - imageFiles.length;

      for (const file of fileArray.slice(0, remaining)) {
        if (!ACCEPTED_TYPES.includes(file.type)) continue;
        if (file.size > MAX_FILE_SIZE) continue;
        newFiles.push({ file, preview: URL.createObjectURL(file) });
      }

      if (newFiles.length > 0) {
        setImageFiles((prev) => [...prev, ...newFiles]);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.images;
          return next;
        });
      }
    },
    [imageFiles.length]
  );

  const removeImage = (index: number) => {
    setImageFiles((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  };

  /* ─── Validation ─── */

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
    }

    if (currentStep === 2) {
      if (!formData.price || Number(formData.price) <= 0) newErrors.price = 'Enter a valid price';
    }

    if (currentStep === 4) {
      if (imageFiles.length === 0) newErrors.images = 'Add at least one image';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 4));
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  /* ─── Submit: upload images then create listing ─── */

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setUploadProgress(0);

    try {
      const uploadRes = await listingsApi.uploadImages(
        imageFiles.map((img) => img.file),
        (percent) => setUploadProgress(percent)
      );

      if (uploadRes.urls.length === 0) {
        throw new Error(
          uploadRes.errors.length > 0
            ? uploadRes.errors.join(' ')
            : 'No images were uploaded successfully.'
        );
      }

      const payload: CreateListingPayload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        category: formData.category || undefined,
        price_per_night: Number(formData.price).toFixed(2),
        bedrooms: Number(formData.bedrooms),
        bathrooms: formData.bathrooms,
        max_guests: Number(formData.guests),
        amenities: formData.amenities,
        images: uploadRes.urls,
      };

      const created = await listingsApi.create(payload);
      onSubmit(created);
      handleOpenChange(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 border-b border-border px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl font-bold text-foreground">
              Create New Listing
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fill in the details to list your property on WanderLeaf
            </DialogDescription>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mt-6">
            {STEPS.map((s, index) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-accent text-accent-foreground shadow-md'
                          : isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isActive ? 'text-accent' : isCompleted ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${
                        isCompleted ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <div className="px-6 py-6 min-h-[340px]">
          <AnimatePresence mode="wait">
            {/* Step 1: Basics */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-foreground">
                    Property Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. Cozy Mountain Cabin with Forest Views"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className={errors.title ? 'border-destructive' : ''}
                  />
                  {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-foreground">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your property, its unique features, and what makes it special..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-muted-foreground" />
                      Location
                    </span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g. Aspen, Colorado, USA"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    className={errors.location ? 'border-destructive' : ''}
                  />
                  {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => updateField('category', val)}
                  >
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
              </motion.div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium text-foreground">
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={14} className="text-muted-foreground" />
                      Price per Night (USD)
                    </span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    placeholder="150"
                    value={formData.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    className={errors.price ? 'border-destructive' : ''}
                  />
                  {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        <BedDouble size={14} className="text-muted-foreground" />
                        Bedrooms
                      </span>
                    </Label>
                    <Select
                      value={formData.bedrooms}
                      onValueChange={(val) => updateField('bedrooms', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Bath size={14} className="text-muted-foreground" />
                        Bathrooms
                      </span>
                    </Label>
                    <Select
                      value={formData.bathrooms}
                      onValueChange={(val) => updateField('bathrooms', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['1', '1.5', '2', '2.5', '3', '3.5', '4'].map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-muted-foreground" />
                        Max Guests
                      </span>
                    </Label>
                    <Select
                      value={formData.guests}
                      onValueChange={(val) => updateField('guests', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview Card */}
                <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                    Listing Preview
                  </p>
                  <p className="font-playfair font-bold text-lg text-foreground">
                    {formData.title || 'Your Property Title'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.bedrooms} bed &bull; {formData.bathrooms} bath &bull; {formData.guests}{' '}
                    guests
                  </p>
                  {formData.price && (
                    <p className="text-primary font-semibold mt-2">
                      ${formData.price}
                      <span className="text-muted-foreground font-normal text-sm"> /night</span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Amenities */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-sm font-medium text-foreground">
                    Select Amenities
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose the amenities your property offers ({formData.amenities.length} selected)
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenitiesList.map((amenity) => {
                    const isSelected = formData.amenities.includes(amenity);
                    return (
                      <motion.button
                        key={amenity}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
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
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 4: Images */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <Label className="text-sm font-medium text-foreground">Property Images</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload up to {MAX_FILES} images of your property (JPEG, PNG, WebP, GIF &mdash; max 10 MB each)
                  </p>
                </div>

                {/* Drag-and-drop zone */}
                {imageFiles.length < MAX_FILES && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : errors.images
                        ? 'border-destructive bg-destructive/5'
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
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                          isDragging ? 'bg-primary/20' : 'bg-muted'
                        }`}
                      >
                        <Upload
                          size={24}
                          className={isDragging ? 'text-primary' : 'text-muted-foreground'}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {isDragging ? 'Drop your images here' : 'Drag & drop images here'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          or{' '}
                          <span className="text-primary font-medium">click to browse</span>
                        </p>
                      </div>
                      {imageFiles.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {imageFiles.length}/{MAX_FILES} images added
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {errors.images && <p className="text-xs text-destructive">{errors.images}</p>}

                {/* Image previews */}
                {imageFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imageFiles.map((img, index) => (
                      <motion.div
                        key={img.preview}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group aspect-video rounded-lg overflow-hidden bg-muted border border-border"
                      >
                        <img
                          src={img.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary text-primary-foreground uppercase tracking-wide">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-foreground/70 text-background opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-medium bg-foreground/60 text-background backdrop-blur-sm">
                          {(img.file.size / (1024 * 1024)).toFixed(1)} MB
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Final Summary */}
                <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border">
                  <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                    Listing Summary
                  </p>
                  <h3 className="font-playfair font-bold text-xl text-foreground">
                    {formData.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin size={14} /> {formData.location}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-foreground">
                    <span>{formData.bedrooms} bed</span>
                    <span>&bull;</span>
                    <span>{formData.bathrooms} bath</span>
                    <span>&bull;</span>
                    <span>{formData.guests} guests</span>
                    <span>&bull;</span>
                    <span className="text-primary font-semibold">${formData.price}/night</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <ImagePlus size={12} />
                    {imageFiles.length} {imageFiles.length === 1 ? 'image' : 'images'} ready to upload
                  </div>
                  {formData.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.amenities.map((a) => (
                        <span
                          key={a}
                          className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {submitError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    {submitError}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex items-center justify-between">
          <div>
            {step > 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={16} />
                Back
              </motion.button>
            )}
          </div>

          <div>
            {step < 4 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Next
                <ArrowRight size={16} />
              </motion.button>
            ) : (
              <div className="flex flex-col items-end gap-1.5">
                {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    Uploading {uploadProgress}%
                  </div>
                )}
                <motion.button
                  whileHover={!isSubmitting ? { scale: 1.05 } : undefined}
                  whileTap={!isSubmitting ? { scale: 0.95 } : undefined}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-colors shadow-md disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {uploadProgress < 100 ? 'Uploading Images...' : 'Creating Listing...'}
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Publish Listing
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
