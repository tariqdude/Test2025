import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { fetchWithTimeout } from './api';

describe('API Utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('should fetch successfully', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    const result = await fetchWithTimeout('https://api.example.com');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ data: 'test' });
  });

  it('should handle error response', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await fetchWithTimeout('https://api.example.com');
    expect(result.success).toBe(false);
    expect(result.error).toContain('404');
  });

  it('should handle network error', async () => {
    (global.fetch as Mock).mockRejectedValue(new Error('Network error'));

    const result = await fetchWithTimeout('https://api.example.com');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
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

    const result = await fetchWithTimeout('https://api.example.com', {}, 100);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Aborted');
  });
});
