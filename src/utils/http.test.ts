import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';
import { request, buildUrl, HttpError, TimeoutError } from './http';

describe('HTTP Utilities', () => {
  describe('buildUrl', () => {
    it('should return url if no params', () => {
      expect(buildUrl('https://api.example.com')).toBe(
        'https://api.example.com'
      );
    });

    it('should append params', () => {
      expect(buildUrl('https://api.example.com', { q: 'test', page: 1 })).toBe(
        'https://api.example.com?q=test&page=1'
      );
    });

    it('should append params to existing query', () => {
      expect(buildUrl('https://api.example.com?sort=asc', { page: 2 })).toBe(
        'https://api.example.com?sort=asc&page=2'
      );
    });

    it('should ignore undefined values', () => {
      expect(
        buildUrl('https://api.example.com', { q: 'test', filter: undefined })
      ).toBe('https://api.example.com?q=test');
    });
  });

  describe('request', () => {
    beforeEach(() => {
      vi.resetAllMocks();
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should make a successful GET request', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        url: 'https://api.example.com',
        redirected: false,
        text: async () => JSON.stringify(mockResponse),
      });

      const response = await request('GET', 'https://api.example.com');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(response.data).toEqual(mockResponse);
      expect(response.status).toBe(200);
    });

    it('should handle JSON body', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        text: async () => '{}',
      });

      await request('POST', 'https://api.example.com', {
        body: { name: 'test' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw HttpError on non-ok response', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        text: async () => JSON.stringify({ error: 'Not Found' }),
      });

      await expect(request('GET', 'https://api.example.com')).rejects.toThrow(
        HttpError
      );
    });

    it('should handle timeout', async () => {
      (global.fetch as Mock).mockImplementation(async (url, options) => {
        const signal = options?.signal;
        return new Promise((_, reject) => {
          if (signal) {
            if (signal.aborted) {
              const error = new Error('Aborted');
              error.name = 'AbortError';
              reject(error);
            } else {
              signal.addEventListener('abort', () => {
                const error = new Error('Aborted');
                error.name = 'AbortError';
                reject(error);
              });
            }
          }
        });
      });

      const reqPromise = request('GET', 'https://api.example.com', {
        timeout: 100,
      });

      await expect(reqPromise).rejects.toThrow(TimeoutError);
    });

    it('should retry on failure', async () => {
      const mockFetch = global.fetch as Mock;
      mockFetch
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          url: 'https://api.example.com',
          redirected: false,
          text: async () => JSON.stringify({ success: true }),
        });

      const response = await request('GET', 'https://api.example.com', {
        retry: { attempts: 2, delay: 1 },
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response.data).toEqual({ success: true });
    });
  });
});
