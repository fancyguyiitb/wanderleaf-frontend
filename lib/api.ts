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

export const apiFetch = async <TResponse>(
  path: string,
  options: RequestInit & { skipAuthHeader?: boolean } = {}
): Promise<TResponse> => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const { skipAuthHeader, headers, ...rest } = options;

  try {
    const response = await fetch(url, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(headers || {}),
      },
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      // Non-JSON response
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

export const getApiBaseUrl = () => getBaseUrl();

