'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Property } from '@/lib/store';
import { amenitiesList, categories } from '@/lib/mock-data';

interface CreatePropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (property: Property) => void;
}

const STEPS = [
  { id: 1, label: 'Basics', icon: Sparkles },
  { id: 2, label: 'Details', icon: BedDouble },
  { id: 3, label: 'Amenities', icon: Check },
  { id: 4, label: 'Images', icon: ImagePlus },
];

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1502886129106-94a008556e23?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1551632786-de41ec16a66b?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&h=800&fit=crop',
];

export default function CreatePropertyForm({
  open,
  onOpenChange,
  onSubmit,
}: CreatePropertyFormProps) {
  const [step, setStep] = useState(1);
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
    imageUrls: ['', '', ''],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setStep(1);
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
      imageUrls: ['', '', ''],
    });
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
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const updateImageUrl = (index: number, value: string) => {
    setFormData((prev) => {
      const urls = [...prev.imageUrls];
      urls[index] = value;
      return { ...prev, imageUrls: urls };
    });
  };

  const addImageSlot = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ''],
    }));
  };

  const removeImageSlot = (index: number) => {
    if (formData.imageUrls.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

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

  const handleSubmit = () => {
    const images = formData.imageUrls.filter((url) => url.trim() !== '');
    const finalImages =
      images.length > 0
        ? images
        : PLACEHOLDER_IMAGES.slice(0, 3);

    const newProperty: Property = {
      id: `host-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      coordinates: { lat: 0, lng: 0 },
      price: Number(formData.price),
      rating: 0,
      reviews: 0,
      images: finalImages,
      amenities: formData.amenities,
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      guests: Number(formData.guests),
      host: {
        id: 'current-user',
        name: 'You',
        rating: 0,
        isVerified: false,
      },
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSubmit(newProperty);
    handleOpenChange(false);
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
              Fill in the details to list your property on StayNature
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
                        <SelectItem key={cat.id} value={String(cat.id)}>
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
                    Add image URLs for your property. Leave blank to use placeholder images.
                  </p>
                </div>

                <div className="space-y-3">
                  {formData.imageUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder={`Image URL ${index + 1} (e.g. https://images.unsplash.com/...)`}
                          value={url}
                          onChange={(e) => updateImageUrl(index, e.target.value)}
                        />
                      </div>
                      {formData.imageUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImageSlot(index)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {formData.imageUrls.length < 8 && (
                  <button
                    type="button"
                    onClick={addImageSlot}
                    className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                  >
                    <ImagePlus size={16} />
                    Add another image
                  </button>
                )}

                {/* Image Preview */}
                {formData.imageUrls.some((url) => url.trim()) && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {formData.imageUrls
                      .filter((url) => url.trim())
                      .map((url, index) => (
                        <div
                          key={index}
                          className="aspect-video rounded-lg overflow-hidden bg-muted border border-border"
                        >
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60"><rect fill="%23eee" width="100" height="60"/><text fill="%23999" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="10">Invalid URL</text></svg>';
                            }}
                          />
                        </div>
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors"
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-colors shadow-md"
              >
                <Check size={18} />
                Publish Listing
              </motion.button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
