import { useAuthStore, Property } from './store';

/* ─── Base URL ─── */

const getBaseUrl = () => {
  const env = process.env.NEXT_PUBLIC_ENV ?? process.env.NODE_ENV;

  const devBase = process.env.NEXT_PUBLIC_API_BASE_URL_DEV;
  const prodBase = process.env.NEXT_PUBLIC_API_BASE_URL_PROD;

  if (env === 'production') {
    if (!prodBase) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL_PROD is not set');
    }
    return prodBase;
  }

  if (!devBase) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL_DEV is not set');
  }

  return devBase;
};

export const getApiBaseUrl = () => getBaseUrl();

/* ─── Generic fetch ─── */

export const apiFetch = async <TResponse>(
  path: string,
  options: RequestInit & { skipAuthHeader?: boolean } = {}
): Promise<TResponse> => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const { skipAuthHeader, headers, ...rest } = options;

  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> || {}),
  };

  if (!skipAuthHeader) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      mergedHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...rest,
      headers: mergedHeaders,
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      if (!response.ok) {
        console.error('[apiFetch] Non-JSON error response', {
          url,
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error('Request failed with non-JSON response');
      }
      return {} as TResponse;
    }

    if (!response.ok) {
      console.error('[apiFetch] HTTP error response', {
        url,
        status: response.status,
        statusText: response.statusText,
        body: data,
      });

      // If auth token is invalid or expired, force logout and redirect to login.
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          try {
            useAuthStore.getState().logout();
            window.localStorage.removeItem('wanderleaf_auth');
          } catch {
            // ignore storage errors
          }
          const currentPath = window.location.pathname + window.location.search;
          const redirect = encodeURIComponent(currentPath || '/');
          window.location.href = `/auth/login?redirect=${redirect}`;
        }
      }

      const message =
        (data as any)?.detail ||
        (data as any)?.message ||
        'Something went wrong while communicating with the server.';
      throw new Error(message);
    }

    console.debug('[apiFetch] Success', { url, data });
    return data as TResponse;
  } catch (error) {
    console.error('[apiFetch] Network or CORS error', {
      url,
      options: rest,
      error,
    });
    throw error;
  }
};

/* ─── Backend response types ─── */

export interface ApiListingHost {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface ApiListing {
  id: string;
  title: string;
  description?: string;
  location: string;
  category: string;
  price_per_night: string;
  bedrooms: number;
  bathrooms: string;
  max_guests: number;
  amenities: string[];
  images: string[];
  latitude: string | null;
  longitude: string | null;
  is_active: boolean;
  host: ApiListingHost;
  created_at: string;
  updated_at: string;
  /** Only present in detail response - for calendar and price calc */
  booked_dates?: { check_in: string; check_out: string }[];
  service_fee_percent?: number;
  cleaning_fee?: number;
}

export interface ApiPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/* ─── Mapper: backend → frontend Property ─── */

export function mapApiListingToProperty(api: ApiListing): Property {
  return {
    id: api.id,
    title: api.title,
    description: api.description ?? '',
    location: api.location,
    category: api.category,
    coordinates: {
      lat: api.latitude ? Number(api.latitude) : 0,
      lng: api.longitude ? Number(api.longitude) : 0,
    },
    price: Number(api.price_per_night),
    rating: 0,
    reviews: 0,
    images: api.images,
    amenities: api.amenities,
    bedrooms: api.bedrooms,
    bathrooms: Number(api.bathrooms),
    guests: api.max_guests,
    host: {
      id: api.host.id,
      name: api.host.name,
      avatar: api.host.avatar ?? undefined,
      rating: 0,
      isVerified: false,
    },
    createdAt: api.created_at,
    bookedDates: api.booked_dates,
    serviceFeePercent: api.service_fee_percent ?? 12,
    cleaningFee: api.cleaning_fee ?? 250,
  };
}

/* ─── Listing create payload ─── */

export interface CreateListingPayload {
  title: string;
  description: string;
  location: string;
  category?: string;
  price_per_night: string;
  bedrooms: number;
  bathrooms: string;
  max_guests: number;
  amenities: string[];
  images: string[];
  latitude?: string;
  longitude?: string;
}

/* ─── Multipart fetch (for file uploads) ─── */

export const apiUpload = async <TResponse>(
  path: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<TResponse> => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (onProgress) {
    return new Promise<TResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data as TResponse);
          } else {
            reject(new Error(data?.detail || 'Upload failed.'));
          }
        } catch {
          reject(new Error('Upload failed with non-JSON response.'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
      xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled.')));

      xhr.send(formData);
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('Upload failed with non-JSON response.');
  }

  if (!response.ok) {
    throw new Error((data as any)?.detail || 'Upload failed.');
  }

  return data as TResponse;
};

/* ─── Upload response type ─── */

export interface UploadImagesResponse {
  urls: string[];
  uploaded: number;
  errors: string[];
}

/* ─── Listings API ─── */

export const listingsApi = {
  async uploadImages(
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<UploadImagesResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return apiUpload<UploadImagesResponse>(
      '/api/v1/listings/upload-images/',
      formData,
      onProgress
    );
  },

  async create(payload: CreateListingPayload): Promise<Property> {
    const data = await apiFetch<ApiListing>('/api/v1/listings/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapApiListingToProperty(data);
  },

  async getMyListings(): Promise<Property[]> {
    const data = await apiFetch<ApiPaginatedResponse<ApiListing>>('/api/v1/listings/my/');
    return data.results.map(mapApiListingToProperty);
  },

  async getAll(): Promise<Property[]> {
    const data = await apiFetch<ApiPaginatedResponse<ApiListing>>('/api/v1/listings/', {
      skipAuthHeader: true,
    });
    return data.results.map(mapApiListingToProperty);
  },

  async search(params: { query?: string; guests?: number }): Promise<Property[]> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.set('search', params.query);
    if (params.guests) searchParams.set('guests', String(params.guests));
    const qs = searchParams.toString();
    const url = `/api/v1/listings/${qs ? `?${qs}` : ''}`;
    const data = await apiFetch<ApiPaginatedResponse<ApiListing>>(url, {
      skipAuthHeader: true,
    });
    return data.results.map(mapApiListingToProperty);
  },

  async getById(id: string): Promise<Property> {
    const data = await apiFetch<ApiListing>(`/api/v1/listings/${id}/`, {
      skipAuthHeader: true,
    });
    return mapApiListingToProperty(data);
  },

  async update(id: string, payload: Partial<CreateListingPayload>): Promise<Property> {
    const data = await apiFetch<ApiListing>(`/api/v1/listings/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapApiListingToProperty(data);
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/api/v1/listings/${id}/`, {
      method: 'DELETE',
    });
  },

  async getByHost(hostId: string): Promise<Property[]> {
    const data = await apiFetch<ApiPaginatedResponse<ApiListing>>(
      `/api/v1/listings/host/${hostId}/`,
      { skipAuthHeader: true }
    );
    return data.results.map(mapApiListingToProperty);
  },
};

/* ─── Bookings API ─── */

export interface CreateBookingPayload {
  listing_id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  special_requests?: string;
}

export interface ApiBookingDetail {
  id: string;
  listing: {
    id: string;
    title: string;
    location: string;
    images: string[];
    price_per_night: string;
  };
  guest: { id: string; name: string; email: string; avatar: string | null };
  host: { id: string; name: string; email: string; avatar: string | null };
  check_in: string;
  check_out: string;
  num_guests: number;
  price_per_night: string;
  num_nights: number;
  subtotal: string;
  service_fee: string;
  cleaning_fee: string;
  total_price: string;
  status: string;
  status_display: string;
  can_be_cancelled: boolean;
  special_requests: string;
  cancellation_reason: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiBooking {
  id: string;
  listing: {
    id: string;
    title: string;
    location: string;
    images: string[];
    price_per_night: string;
  };
  guest: { id: string; name: string; email: string; avatar: string | null };
  check_in: string;
  check_out: string;
  num_guests: number;
  num_nights: number;
  total_price: string;
  status: string;
  status_display: string;
  created_at: string;
}

export const bookingsApi = {
  async create(payload: CreateBookingPayload) {
    return apiFetch<{
      booking: ApiBooking;
      payment: Record<string, unknown>;
    }>('/api/v1/bookings/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async list(params?: { status?: string; upcoming?: boolean; past?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.upcoming) searchParams.set('upcoming', 'true');
    if (params?.past) searchParams.set('past', 'true');
    const qs = searchParams.toString();
    const url = `/api/v1/bookings/${qs ? `?${qs}` : ''}`;
    return apiFetch<
      ApiBooking[] | { count: number; next: string | null; previous: string | null; results: ApiBooking[] }
    >(url);
  },

  async listForHost(params?: { listingId?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.listingId) searchParams.set('listing_id', params.listingId);
    if (params?.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    const url = `/api/v1/bookings/host/${qs ? `?${qs}` : ''}`;
    return apiFetch<
      ApiBooking[] | { count: number; next: string | null; previous: string | null; results: ApiBooking[] }
    >(url);
  },

  async getById(id: string) {
    return apiFetch<ApiBookingDetail>(`/api/v1/bookings/${id}/`);
  },

  async confirm(bookingId: string) {
    return apiFetch<{ detail: string; booking: ApiBooking }>(`/api/v1/bookings/${bookingId}/confirm/`, {
      method: 'POST',
    });
  },

  async verifyPayment(
    bookingId: string,
    payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  ) {
    return apiFetch<{ detail: string; booking: ApiBooking }>(
      `/api/v1/bookings/${bookingId}/verify-payment/`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  async cancel(bookingId: string, reason?: string) {
    return apiFetch<{ detail: string; booking: ApiBookingDetail }>(
      `/api/v1/bookings/${bookingId}/cancel/`,
      {
        method: 'POST',
        body: JSON.stringify({ reason: reason ?? '' }),
      }
    );
  },
};

/* ─── Wishlist API ─── */

export const wishlistApi = {
  /** Get all wishlisted listings for the current user (requires auth). */
  async list(): Promise<Property[]> {
    const data = await apiFetch<ApiListing[]>(`/api/v1/wishlist/`);
    return data.map(mapApiListingToProperty);
  },

  /** Add a listing to the wishlist (requires auth). */
  async add(listingId: string): Promise<void> {
    await apiFetch(`/api/v1/wishlist/${listingId}/`, {
      method: 'POST',
    });
  },

  /** Remove a listing from the wishlist (requires auth). */
  async remove(listingId: string): Promise<void> {
    await apiFetch(`/api/v1/wishlist/${listingId}/`, {
      method: 'DELETE',
    });
  },
};
