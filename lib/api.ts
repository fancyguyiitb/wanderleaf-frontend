import { useAuthStore, Property } from './store';

/* ─── API Error (for status/code) ─── */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

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

export interface RetryPolicy {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
  retryOnStatuses?: number[];
  retryOnNetworkError?: boolean;
}

const TRANSIENT_API_STATUS_CODES = [408, 425, 429, 500, 502, 503, 504];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const createIdempotencyKey = (prefix: string = 'req') => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const isRetryableNetworkError = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    error instanceof TypeError ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('cors')
  );
};

/* ─── Generic fetch ─── */

export const apiFetch = async <TResponse>(
  path: string,
  options: RequestInit & {
    skipAuthHeader?: boolean;
    retryPolicy?: RetryPolicy;
    idempotencyKey?: string;
  } = {}
): Promise<TResponse> => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const { skipAuthHeader, retryPolicy, idempotencyKey, headers, ...rest } = options;

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

  if (idempotencyKey) {
    mergedHeaders['Idempotency-Key'] = idempotencyKey;
  }

  const maxRetries = retryPolicy?.maxRetries ?? 0;
  const retryOnStatuses = retryPolicy?.retryOnStatuses ?? TRANSIENT_API_STATUS_CODES;
  const retryOnNetworkError = retryPolicy?.retryOnNetworkError ?? false;
  const initialDelayMs = retryPolicy?.initialDelayMs ?? 300;
  const backoffMultiplier = retryPolicy?.backoffMultiplier ?? 2;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
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

          if (attempt < maxRetries && retryOnStatuses.includes(response.status)) {
            await sleep(initialDelayMs * backoffMultiplier ** attempt);
            continue;
          }

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
          attempt,
        });

        if (response.status === 401) {
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

        if (attempt < maxRetries && retryOnStatuses.includes(response.status)) {
          await sleep(initialDelayMs * backoffMultiplier ** attempt);
          continue;
        }

        const message =
          (data as any)?.detail ||
          (data as any)?.message ||
          'Something went wrong while communicating with the server.';
        const code = (data as any)?.code;
        throw new ApiError(message, response.status, code, data);
      }

      console.debug('[apiFetch] Success', { url, data, attempt });
      return data as TResponse;
    } catch (error) {
      if (
        attempt < maxRetries &&
        retryOnNetworkError &&
        isRetryableNetworkError(error)
      ) {
        console.warn('[apiFetch] Retrying transient network error', {
          url,
          attempt,
          error,
        });
        await sleep(initialDelayMs * backoffMultiplier ** attempt);
        continue;
      }

      console.error('[apiFetch] Network or CORS error', {
        url,
        options: rest,
        error,
      });
      throw error;
    }
  }

  throw new Error('Request retry loop exited unexpectedly');
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
  /** From reviews - present in list and detail responses */
  rating?: number | string;
  review_count?: number;
  rating_breakdown?: { stars: number; count: number; percentage: number }[];
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
    rating: api.rating != null && api.rating !== '' ? Number(api.rating) : 0,
    reviews: api.review_count ?? 0,
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
    ratingBreakdown: api.rating_breakdown,
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

export interface ApiBookingConflict {
  id: string;
  check_in: string;
  check_out: string;
  status: string;
}

export interface ApiAvailabilityCheckResponse {
  is_available: boolean;
  check_in: string;
  check_out: string;
  conflicts_count: number;
  conflicts: ApiBookingConflict[];
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
  payment_retry_disallowed?: boolean;
  payment_deadline_seconds?: number;
  refund_amount?: number | null;
  refunded_at?: string | null;
  refund_status?: string | null;
  refund_failed?: boolean;
  can_write_review?: boolean;
  existing_review_id?: string | null;
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

export interface ApiChatUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  chat_encryption: ApiChatParticipantEncryption | null;
}

export interface ApiChatParticipantEncryption {
  public_key: string;
  algorithm: string;
  version: number;
}

export interface ApiEncryptedWrappedKey {
  wrapped_key: string;
  key_version: number;
}

export interface ApiEncryptedBody {
  ciphertext: string;
  iv: string;
  wrapped_keys: Record<string, ApiEncryptedWrappedKey>;
  algorithm: string;
  key_algorithm: string;
  version: number;
  sender_key_version: number;
}

export interface ApiChatMessage {
  id: string;
  sender: ApiChatUser;
  body: string;
  encrypted_body: ApiEncryptedBody | null;
  is_encrypted: boolean;
  message_type: 'text' | 'image' | 'file';
  attachment_url: string;
  attachment_name: string;
  attachment_mime: string;
  attachment_bytes: number | null;
  created_at: string;
  updated_at: string;
}

export interface ApiConversation {
  id: string;
  booking_id: string;
  booking_status: string;
  booking_status_display: string;
  is_chat_available: boolean;
  participants: ApiChatUser[];
  messages: ApiChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ApiChatNotification {
  booking_id: string;
  conversation_id: string;
  booking_title: string;
  message: ApiChatMessage;
}

export interface ApiInboxItem {
  id: string;
  booking_id: string;
  booking_title: string;
  is_chat_available: boolean;
  other_participant: ApiChatUser;
  last_message: string;
  last_message_at: string | null;
  unread_count: number;
}

export interface ApiUnreadCountResponse {
  total: number;
}

export interface ApiAttachmentUpload {
  attachment_url: string;
  attachment_name: string;
  attachment_mime: string;
  attachment_bytes: number | null;
  message_type: 'image' | 'file';
}

export interface ApiCurrentUserChatKey {
  has_backup: boolean;
  public_key: string;
  key_algorithm: string;
  key_version: number;
  encrypted_private_key: string;
  backup_iv: string;
  backup_salt: string;
  backup_kdf: string;
  backup_kdf_iterations: number;
  backup_cipher: string;
  backup_version: number;
  chat_key_uploaded_at: string | null;
}

export const bookingsApi = {
  async create(payload: CreateBookingPayload, options?: { idempotencyKey?: string }) {
    return apiFetch<{
      booking: ApiBooking;
      payment: Record<string, unknown>;
    }>('/api/v1/bookings/', {
      method: 'POST',
      body: JSON.stringify(payload),
      idempotencyKey: options?.idempotencyKey,
      retryPolicy: {
        maxRetries: options?.idempotencyKey ? 2 : 0,
        retryOnStatuses: [502, 503, 504],
        retryOnNetworkError: Boolean(options?.idempotencyKey),
      },
    });
  },

  async checkAvailability(payload: Pick<CreateBookingPayload, 'listing_id' | 'check_in' | 'check_out'>) {
    return apiFetch<ApiAvailabilityCheckResponse>('/api/v1/bookings/check-availability/', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuthHeader: true,
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

  async verifyPayment(
    bookingId: string,
    payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  ) {
    return apiFetch<{ detail: string; booking: ApiBooking }>(
      `/api/v1/bookings/${bookingId}/verify-payment/`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        retryPolicy: {
          maxRetries: 2,
          retryOnStatuses: [502, 503, 504],
          retryOnNetworkError: true,
        },
      }
    );
  },

  async retryPayment(bookingId: string, options?: { idempotencyKey?: string }) {
    return apiFetch<{
      order_id: string;
      razorpay_key_id: string;
      amount: number;
      currency: string;
      payment_id: string;
    }>(`/api/v1/bookings/${bookingId}/retry-payment/`, {
      method: 'POST',
      idempotencyKey: options?.idempotencyKey,
      retryPolicy: {
        maxRetries: options?.idempotencyKey ? 2 : 0,
        retryOnStatuses: [502, 503, 504],
        retryOnNetworkError: Boolean(options?.idempotencyKey),
      },
    });
  },

  async cancel(bookingId: string, reason?: string) {
    return apiFetch<{
      detail: string;
      booking: ApiBookingDetail;
      refund_code?: 'refund_initiated' | 'refund_failed' | 'no_refund_needed';
    }>(`/api/v1/bookings/${bookingId}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason ?? '' }),
    });
  },
};

/* ─── Messaging API ─── */

const getWebSocketBaseUrl = () => {
  const apiBase = new URL(getBaseUrl());
  apiBase.protocol = apiBase.protocol === 'https:' ? 'wss:' : 'ws:';
  apiBase.pathname = '';
  apiBase.search = '';
  apiBase.hash = '';
  return apiBase.toString().replace(/\/$/, '');
};

export const messagingApi = {
  async listInbox() {
    return apiFetch<ApiInboxItem[]>('/api/v1/messaging/inbox/');
  },

  async getUnreadCount() {
    return apiFetch<ApiUnreadCountResponse>('/api/v1/messaging/unread-count/');
  },

  async getConversationForBooking(bookingId: string) {
    return apiFetch<ApiConversation>(`/api/v1/messaging/bookings/${bookingId}/conversation/`);
  },

  async markConversationAsRead(conversationId: string) {
    return apiFetch<{ detail: string }>(
      `/api/v1/messaging/conversations/${conversationId}/mark-read/`,
      { method: 'POST' }
    );
  },

  async uploadAttachment(conversationId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiUpload<ApiAttachmentUpload>(
      `/api/v1/messaging/conversations/${conversationId}/attachments/`,
      formData
    );
  },

  getConversationWebSocketUrl(conversationId: string) {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      throw new Error('Missing authentication token for chat connection.');
    }
    return `${getWebSocketBaseUrl()}/ws/messaging/conversations/${conversationId}/?token=${encodeURIComponent(token)}`;
  },

  getNotificationsWebSocketUrl() {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      throw new Error('Missing authentication token for chat connection.');
    }
    return `${getWebSocketBaseUrl()}/ws/messaging/notifications/?token=${encodeURIComponent(token)}`;
  },
};

export const authApi = {
  async getMyChatKey() {
    return apiFetch<ApiCurrentUserChatKey>('/api/v1/auth/me/chat-key/');
  },

  async registerMyChatKey(payload: {
    public_key: string;
    key_algorithm: string;
    key_version: number;
    encrypted_private_key: string;
    backup_iv: string;
    backup_salt: string;
    backup_kdf: string;
    backup_kdf_iterations: number;
    backup_cipher: string;
    backup_version: number;
  }) {
    return apiFetch<ApiCurrentUserChatKey>('/api/v1/auth/me/chat-key/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

/* ─── Reviews API ─── */

export interface ApiReview {
  id: string;
  author: { id: string; name: string; avatar: string | null };
  rating: number;
  comment: string;
  created_at: string;
}

export interface ApiReviewsListResponse {
  results: ApiReview[];
  count: number;
  next_offset: number | null;
}

export const reviewsApi = {
  async list(
    listingId: string,
    limit = 4,
    offset = 0
  ): Promise<ApiReviewsListResponse> {
    const params = new URLSearchParams({ listing: listingId });
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    return apiFetch<ApiReviewsListResponse>(
      `/api/v1/reviews/?${params.toString()}`,
      { skipAuthHeader: true }
    );
  },

  async create(bookingId: string, rating: number, comment: string): Promise<ApiReview> {
    return apiFetch<ApiReview>('/api/v1/reviews/', {
      method: 'POST',
      body: JSON.stringify({
        booking_id: bookingId,
        rating,
        comment,
      }),
    });
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
