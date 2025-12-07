/**
 * Clipboard Utilities
 * @module utils/clipboard
 * @description Modern clipboard API wrapper with fallbacks,
 * supporting text, HTML, images, and rich content.
 */

import { isBrowser } from './dom';

/**
 * Check if the Clipboard API is available
 */
export const isClipboardSupported = (): boolean => {
  return isBrowser() && 'clipboard' in navigator;
};

/**
 * Check if clipboard read is allowed
 */
export const canReadClipboard = async (): Promise<boolean> => {
  if (!isClipboardSupported()) return false;
  try {
    const permission = await navigator.permissions.query({
      name: 'clipboard-read' as PermissionName,
    });
    return permission.state === 'granted' || permission.state === 'prompt';
  } catch {
    return false;
  }
};

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copy succeeds
 * @example await copyText('Hello, World!');
 */
export async function copyText(text: string): Promise<boolean> {
  if (!isBrowser()) return false;

  // Modern API
  if (isClipboardSupported()) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback using execCommand (deprecated but widely supported)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Read text from clipboard
 * @returns Promise with clipboard text or null if unavailable
 * @example const text = await readText();
 */
export async function readText(): Promise<string | null> {
  if (!isClipboardSupported()) return null;

  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

/**
 * Copy HTML content to clipboard (with plain text fallback)
 * @param html - HTML content to copy
 * @param plainText - Plain text fallback
 */
export async function copyHtml(
  html: string,
  plainText?: string
): Promise<boolean> {
  if (!isBrowser()) return false;

  if (isClipboardSupported() && 'ClipboardItem' in window) {
    try {
      const items = [
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plainText || stripHtmlTags(html)], {
            type: 'text/plain',
          }),
        }),
      ];
      await navigator.clipboard.write(items);
      return true;
    } catch {
      // Fall through to plain text
    }
  }

  return copyText(plainText || stripHtmlTags(html));
}

/**
 * Copy an image to clipboard from a Blob or URL
 * @param source - Image Blob or URL
 */
export async function copyImage(source: Blob | string): Promise<boolean> {
  if (!isBrowser() || !isClipboardSupported()) return false;
  if (!('ClipboardItem' in window)) return false;

  try {
    let blob: Blob;

    if (typeof source === 'string') {
      const response = await fetch(source);
      blob = await response.blob();
    } else {
      blob = source;
    }

    // Ensure it's a PNG (required by clipboard API)
    if (blob.type !== 'image/png') {
      blob = await convertToPng(blob);
    }

    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read image from clipboard
 * @returns Promise with image Blob or null
 */
export async function readImage(): Promise<Blob | null> {
  if (!isClipboardSupported() || !('ClipboardItem' in window)) return null;

  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      if (item.types.includes('image/png')) {
        return await item.getType('image/png');
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Create a copy button that copies target element's text
 * @param button - Button element
 * @param target - Target element or selector
 * @param options - Configuration options
 */
export function createCopyButton(
  button: HTMLElement,
  target: HTMLElement | string,
  options: {
    successText?: string;
    successDuration?: number;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  } = {}
): () => void {
  const {
    successText = 'Copied!',
    successDuration = 2000,
    onSuccess,
    onError,
  } = options;

  const originalText = button.textContent;

  const handleClick = async () => {
    const targetEl =
      typeof target === 'string' ? document.querySelector(target) : target;

    if (!targetEl) {
      onError?.(new Error('Target element not found'));
      return;
    }

    const text = targetEl.textContent || '';
    const success = await copyText(text);

    if (success) {
      button.textContent = successText;
      onSuccess?.();
      setTimeout(() => {
        button.textContent = originalText;
      }, successDuration);
    } else {
      onError?.(new Error('Copy failed'));
    }
  };

  button.addEventListener('click', handleClick);

  // Return cleanup function
  return () => {
    button.removeEventListener('click', handleClick);
  };
}

/**
 * Hook for monitoring clipboard changes (where supported)
 * Note: This is experimental and may not work in all browsers
 */
export function onClipboardChange(
  callback: (event: ClipboardEvent) => void
): () => void {
  if (!isBrowser()) return () => {};

  const handler = (event: ClipboardEvent) => callback(event);

  document.addEventListener('copy', handler);
  document.addEventListener('cut', handler);
  document.addEventListener('paste', handler);

  return () => {
    document.removeEventListener('copy', handler);
    document.removeEventListener('cut', handler);
    document.removeEventListener('paste', handler);
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function stripHtmlTags(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

async function convertToPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      canvas.toBlob(pngBlob => {
        URL.revokeObjectURL(url);
        if (pngBlob) {
          resolve(pngBlob);
        } else {
          reject(new Error('Failed to convert to PNG'));
        }
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
