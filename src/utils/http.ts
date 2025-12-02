/**
 * HTTP Client Utilities
 * Type-safe, feature-rich HTTP client wrapper
 */

/**
 * HTTP methods
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

/**
 * Request configuration
 */
export interface RequestConfig {
  /** Request headers */
  headers?: Record<string, string>;
  /** URL query parameters */
  params?: Record<string, string | number | boolean | undefined>;
  /** Request body (will be JSON serialized if object) */
  body?: unknown;
  /** Request timeout in ms */
  timeout?: number;
  /** Abort signal */
  signal?: AbortSignal;
  /** Credentials mode */
  credentials?: RequestCredentials;
  /** Cache mode */
  cache?: RequestCache;
  /** Response type */
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';
  /** Base URL to prepend */
  baseURL?: string;
  /** Custom fetch implementation */
  fetch?: typeof fetch;
  /** Transform request before sending */
  transformRequest?: (config: RequestConfig) => RequestConfig;
  /** Transform response after receiving */
  transformResponse?: <T>(response: T, res: Response) => T;
  /** Retry configuration */
  retry?: {
    attempts: number;
    delay?: number;
    backoff?: boolean;
    retryOn?: (error: Error, attempt: number) => boolean;
  };
}

/**
 * Response wrapper
 */
export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  ok: boolean;
  url: string;
  redirected: boolean;
}

/**
 * HTTP Error
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public response?: Response,
    public data?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Timeout Error
 */
export class TimeoutError extends Error {
  constructor(message = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Build URL with query parameters
 */
export function buildUrl(
  url: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${searchParams.toString()}`;
}

/**
 * Create a fetch wrapper with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number }
): Promise<Response> {
  const { timeout, ...fetchOptions } = options;

  if (!timeout) {
    return fetch(url, fetchOptions);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new TimeoutError();
    }
    throw error;
  }
}

/**
 * Sleep helper
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Core request function
 */
export async function request<T = unknown>(
  method: HttpMethod,
  url: string,
  config: RequestConfig = {}
): Promise<HttpResponse<T>> {
  // Apply transform before destructuring
  const effectiveConfig = config.transformRequest
    ? config.transformRequest(config)
    : config;

  const {
    headers = {},
    params,
    body,
    timeout,
    signal,
    credentials,
    cache,
    responseType = 'json',
    baseURL = '',
    transformResponse,
    retry,
  } = effectiveConfig;

  // Build full URL
  let fullUrl = baseURL
    ? `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
    : url;
  fullUrl = buildUrl(fullUrl, params);

  // Prepare request options
  const requestHeaders: Record<string, string> = { ...headers };
  let requestBody: BodyInit | undefined;

  if (body !== undefined) {
    if (
      body instanceof FormData ||
      body instanceof Blob ||
      body instanceof ArrayBuffer
    ) {
      requestBody = body;
    } else if (typeof body === 'object') {
      requestBody = JSON.stringify(body);
      requestHeaders['Content-Type'] =
        requestHeaders['Content-Type'] || 'application/json';
    } else {
      requestBody = String(body);
    }
  }

  const fetchOptions: RequestInit & { timeout?: number } = {
    method,
    headers: requestHeaders,
    body: requestBody,
    signal,
    credentials,
    cache,
    timeout,
  };

  // Execute request with optional retry
  let lastError: Error | undefined;
  const maxAttempts = retry?.attempts ?? 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(fullUrl, fetchOptions);

      // Parse response based on type
      let data: T;
      switch (responseType) {
        case 'text':
          data = (await response.text()) as T;
          break;
        case 'blob':
          data = (await response.blob()) as T;
          break;
        case 'arrayBuffer':
          data = (await response.arrayBuffer()) as T;
          break;
        case 'formData':
          data = (await response.formData()) as T;
          break;
        case 'json':
        default: {
          const text = await response.text();
          data = text ? JSON.parse(text) : null;
          break;
        }
      }

      if (!response.ok) {
        throw new HttpError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          response,
          data
        );
      }

      // Apply response transformation
      const finalData = transformResponse
        ? transformResponse(data, response)
        : data;

      return {
        data: finalData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        ok: response.ok,
        url: response.url,
        redirected: response.redirected,
      };
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (attempt < maxAttempts) {
        const shouldRetry = retry?.retryOn
          ? retry.retryOn(lastError, attempt)
          : !(
              error instanceof HttpError &&
              error.status >= 400 &&
              error.status < 500
            );

        if (shouldRetry) {
          const delay = retry?.delay ?? 1000;
          const waitTime = retry?.backoff
            ? delay * Math.pow(2, attempt - 1)
            : delay;
          await sleep(waitTime);
          continue;
        }
      }
      throw error;
    }
  }

  throw lastError;
}

/**
 * GET request
 */
export function get<T = unknown>(
  url: string,
  config?: RequestConfig
): Promise<HttpResponse<T>> {
  return request<T>('GET', url, config);
}

/**
 * POST request
 */
export function post<T = unknown>(
  url: string,
  body?: unknown,
  config?: RequestConfig
): Promise<HttpResponse<T>> {
  return request<T>('POST', url, { ...config, body });
}

/**
 * PUT request
 */
export function put<T = unknown>(
  url: string,
  body?: unknown,
  config?: RequestConfig
): Promise<HttpResponse<T>> {
  return request<T>('PUT', url, { ...config, body });
}

/**
 * PATCH request
 */
export function patch<T = unknown>(
  url: string,
  body?: unknown,
  config?: RequestConfig
): Promise<HttpResponse<T>> {
  return request<T>('PATCH', url, { ...config, body });
}

/**
 * DELETE request
 */
export function del<T = unknown>(
  url: string,
  config?: RequestConfig
): Promise<HttpResponse<T>> {
  return request<T>('DELETE', url, config);
}

/**
 * HEAD request
 */
export function head(
  url: string,
  config?: RequestConfig
): Promise<HttpResponse<void>> {
  return request<void>('HEAD', url, config);
}

/**
 * OPTIONS request
 */
export function options(
  url: string,
  config?: RequestConfig
): Promise<HttpResponse<void>> {
  return request<void>('OPTIONS', url, config);
}

/**
 * Create an HTTP client instance with shared configuration
 */
export interface HttpClient {
  get: typeof get;
  post: typeof post;
  put: typeof put;
  patch: typeof patch;
  delete: typeof del;
  head: typeof head;
  options: typeof options;
  request: typeof request;
  setHeader: (key: string, value: string) => void;
  setHeaders: (headers: Record<string, string>) => void;
  removeHeader: (key: string) => void;
  setBaseURL: (url: string) => void;
  setTimeout: (timeout: number) => void;
}

export function createClient(defaultConfig: RequestConfig = {}): HttpClient {
  let config = { ...defaultConfig };

  const mergeConfig = (requestConfig?: RequestConfig): RequestConfig => ({
    ...config,
    ...requestConfig,
    headers: { ...config.headers, ...requestConfig?.headers },
  });

  return {
    get: (url, cfg) => get(url, mergeConfig(cfg)),
    post: (url, body, cfg) => post(url, body, mergeConfig(cfg)),
    put: (url, body, cfg) => put(url, body, mergeConfig(cfg)),
    patch: (url, body, cfg) => patch(url, body, mergeConfig(cfg)),
    delete: (url, cfg) => del(url, mergeConfig(cfg)),
    head: (url, cfg) => head(url, mergeConfig(cfg)),
    options: (url, cfg) => options(url, mergeConfig(cfg)),
    request: (method, url, cfg) => request(method, url, mergeConfig(cfg)),
    setHeader: (key, value) => {
      config.headers = { ...config.headers, [key]: value };
    },
    setHeaders: headers => {
      config.headers = { ...config.headers, ...headers };
    },
    removeHeader: key => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [key]: removed, ...rest } = config.headers ?? {};
      config.headers = rest;
    },
    setBaseURL: url => {
      config.baseURL = url;
    },
    setTimeout: timeout => {
      config.timeout = timeout;
    },
  };
}

/**
 * Request interceptors
 */
export interface Interceptors {
  request: Array<
    (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  >;
  response: Array<
    (response: HttpResponse) => HttpResponse | Promise<HttpResponse>
  >;
  error: Array<(error: Error) => Error | Promise<never>>;
}

export function createInterceptorClient(
  defaultConfig: RequestConfig = {}
): HttpClient & { interceptors: Interceptors } {
  const interceptors: Interceptors = {
    request: [],
    response: [],
    error: [],
  };

  const client = createClient(defaultConfig);

  const interceptedRequest = async <T>(
    method: HttpMethod,
    url: string,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> => {
    try {
      // Apply request interceptors
      let finalConfig = { ...defaultConfig, ...config };
      for (const interceptor of interceptors.request) {
        finalConfig = await interceptor(finalConfig);
      }

      // Make request
      let response = await request<T>(method, url, finalConfig);

      // Apply response interceptors
      for (const interceptor of interceptors.response) {
        response = (await interceptor(response)) as HttpResponse<T>;
      }

      return response;
    } catch (error) {
      // Apply error interceptors
      for (const interceptor of interceptors.error) {
        await interceptor(error as Error);
      }
      throw error;
    }
  };

  return {
    ...client,
    get: (url, cfg) => interceptedRequest('GET', url, cfg),
    post: (url, body, cfg) => interceptedRequest('POST', url, { ...cfg, body }),
    put: (url, body, cfg) => interceptedRequest('PUT', url, { ...cfg, body }),
    patch: (url, body, cfg) =>
      interceptedRequest('PATCH', url, { ...cfg, body }),
    delete: (url, cfg) => interceptedRequest('DELETE', url, cfg),
    head: (url, cfg) =>
      interceptedRequest('HEAD', url, cfg) as Promise<HttpResponse<void>>,
    options: (url, cfg) =>
      interceptedRequest('OPTIONS', url, cfg) as Promise<HttpResponse<void>>,
    request: interceptedRequest,
    interceptors,
  };
}

/**
 * Resource-based API client
 */
export interface Resource<T> {
  list: (params?: Record<string, unknown>) => Promise<T[]>;
  get: (id: string | number) => Promise<T>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string | number, data: Partial<T>) => Promise<T>;
  delete: (id: string | number) => Promise<void>;
}

export function createResource<T>(
  baseURL: string,
  client: HttpClient = createClient()
): Resource<T> {
  return {
    list: async params => {
      const response = await client.get<T[]>(baseURL, {
        params: params as Record<string, string>,
      });
      return response.data;
    },
    get: async id => {
      const response = await client.get<T>(`${baseURL}/${id}`);
      return response.data;
    },
    create: async data => {
      const response = await client.post<T>(baseURL, data);
      return response.data;
    },
    update: async (id, data) => {
      const response = await client.patch<T>(`${baseURL}/${id}`, data);
      return response.data;
    },
    delete: async id => {
      await client.delete(`${baseURL}/${id}`);
    },
  };
}

/**
 * Upload file with progress
 */
export async function uploadFile(
  url: string,
  file: File,
  options: {
    fieldName?: string;
    headers?: Record<string, string>;
    onProgress?: (progress: number) => void;
    additionalData?: Record<string, string>;
  } = {}
): Promise<HttpResponse<unknown>> {
  const {
    fieldName = 'file',
    headers = {},
    onProgress,
    additionalData = {},
  } = options;

  const formData = new FormData();
  formData.append(fieldName, file);

  for (const [key, value] of Object.entries(additionalData)) {
    formData.append(key, value);
  }

  // XMLHttpRequest for progress support
  if (onProgress && typeof XMLHttpRequest !== 'undefined') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let data;
          try {
            data = JSON.parse(xhr.responseText);
          } catch {
            data = xhr.responseText;
          }
          resolve({
            data,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers(),
            ok: true,
            url: xhr.responseURL,
            redirected: false,
          });
        } else {
          reject(
            new HttpError(
              `HTTP ${xhr.status}: ${xhr.statusText}`,
              xhr.status,
              xhr.statusText
            )
          );
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', url);
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }
      xhr.send(formData);
    });
  }

  // Fallback to fetch without progress
  return post(url, formData, { headers });
}

/**
 * Download file with progress
 */
export async function downloadFile(
  url: string,
  options: {
    filename?: string;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<Blob> {
  const { onProgress } = options;

  const response = await fetch(url);

  if (!response.ok) {
    throw new HttpError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      response.statusText,
      response
    );
  }

  if (onProgress && response.body) {
    const contentLength = Number(response.headers.get('content-length')) || 0;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (contentLength > 0) {
        onProgress(Math.round((receivedLength / contentLength) * 100));
      }
    }

    // Combine chunks into a single ArrayBuffer then create Blob
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return new Blob([combined]);
  }

  return response.blob();
}

/**
 * Trigger file download in browser
 */
export function triggerDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * GraphQL client
 */
export interface GraphQLClient {
  query: <T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ) => Promise<T>;
  mutate: <T = unknown>(
    mutation: string,
    variables?: Record<string, unknown>
  ) => Promise<T>;
}

export function createGraphQLClient(
  endpoint: string,
  options: RequestConfig = {}
): GraphQLClient {
  const execute = async <T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> => {
    const response = await post<{
      data: T;
      errors?: Array<{ message: string }>;
    }>(endpoint, { query, variables }, options);

    if (response.data.errors?.length) {
      throw new Error(response.data.errors.map(e => e.message).join(', '));
    }

    return response.data.data;
  };

  return {
    query: execute,
    mutate: execute,
  };
}

/**
 * Server-Sent Events wrapper
 */
export interface SSEClient {
  onMessage: (handler: (data: unknown) => void) => void;
  onError: (handler: (error: Event) => void) => void;
  close: () => void;
}

export function createSSEClient(url: string): SSEClient {
  const eventSource = new EventSource(url);

  return {
    onMessage: handler => {
      eventSource.onmessage = event => {
        try {
          handler(JSON.parse(event.data));
        } catch {
          handler(event.data);
        }
      };
    },
    onError: handler => {
      eventSource.onerror = handler;
    },
    close: () => {
      eventSource.close();
    },
  };
}

/**
 * Polling helper
 */
export function poll<T>(
  fetcher: () => Promise<T>,
  options: {
    interval?: number;
    condition?: (data: T) => boolean;
    maxAttempts?: number;
    onData?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
): { stop: () => void; promise: Promise<T | undefined> } {
  const { interval = 5000, condition, maxAttempts, onData, onError } = options;

  let stopped = false;
  let attempts = 0;
  let timeoutId: ReturnType<typeof setTimeout>;

  const promise = new Promise<T | undefined>(resolve => {
    const tick = async () => {
      if (stopped) {
        resolve(undefined);
        return;
      }

      try {
        const data = await fetcher();
        attempts++;
        onData?.(data);

        if (condition && condition(data)) {
          resolve(data);
          return;
        }

        if (maxAttempts && attempts >= maxAttempts) {
          resolve(undefined);
          return;
        }

        timeoutId = setTimeout(tick, interval);
      } catch (error) {
        onError?.(error as Error);
        if (!stopped) {
          timeoutId = setTimeout(tick, interval);
        }
      }
    };

    tick();
  });

  return {
    stop: () => {
      stopped = true;
      clearTimeout(timeoutId);
    },
    promise,
  };
}
