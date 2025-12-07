/**
 * Tests for share utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as share from './share';

describe('share utilities', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      share: vi.fn().mockResolvedValue(undefined),
      canShare: vi.fn().mockReturnValue(true),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('isShareSupported', () => {
    it('should return true when Web Share API is available', () => {
      expect(share.isShareSupported()).toBe(true);
    });

    it('should return false when Web Share API is not available', () => {
      vi.stubGlobal('navigator', {});
      expect(share.isShareSupported()).toBe(false);
    });
  });

  describe('isFileShareSupported', () => {
    it('should return true when canShare is available', () => {
      expect(share.isFileShareSupported()).toBe(true);
    });

    it('should return false when canShare is not available', () => {
      vi.stubGlobal('navigator', { share: vi.fn() });
      expect(share.isFileShareSupported()).toBe(false);
    });
  });

  describe('canShare', () => {
    it('should return true when content can be shared', () => {
      expect(
        share.canShare({ title: 'Test', url: 'https://example.com' })
      ).toBe(true);
    });

    it('should return false when canShare throws', () => {
      vi.stubGlobal('navigator', {
        canShare: vi.fn().mockImplementation(() => {
          throw new Error('Not allowed');
        }),
      });
      expect(share.canShare({ title: 'Test' })).toBe(false);
    });
  });

  describe('share', () => {
    it('should call navigator.share with data', async () => {
      const data = { title: 'Test', url: 'https://example.com' };
      const result = await share.share(data);

      expect(navigator.share).toHaveBeenCalledWith(data);
      expect(result).toBe(true);
    });

    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn();
      await share.share({ title: 'Test' }, { onSuccess });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle AbortError (user cancelled)', async () => {
      const error = new Error('User cancelled');
      error.name = 'AbortError';
      vi.stubGlobal('navigator', {
        share: vi.fn().mockRejectedValue(error),
      });

      const onCancel = vi.fn();
      const result = await share.share({ title: 'Test' }, { onCancel });

      expect(result).toBe(false);
      expect(onCancel).toHaveBeenCalled();
    });

    it('should use fallback when share is not supported', async () => {
      vi.stubGlobal('navigator', {});

      const fallback = vi.fn();
      await share.share({ title: 'Test' }, { fallback });

      expect(fallback).toHaveBeenCalledWith({ title: 'Test' });
    });

    it('should copy URL when fallback and copyFallback is true', async () => {
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      const result = await share.share(
        { url: 'https://example.com' },
        { copyFallback: true }
      );

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://example.com'
      );
      expect(result).toBe(true);
    });

    it('should call onError when share fails', async () => {
      vi.stubGlobal('navigator', {});

      const onError = vi.fn();
      await share.share(
        { title: 'Test' },
        { fallback: undefined, copyFallback: false, onError }
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Share not supported' })
      );
    });
  });

  describe('socialPlatforms', () => {
    it('should have twitter configuration', () => {
      const url = share.socialPlatforms.twitter.shareUrl({
        text: 'Hello',
        url: 'https://example.com',
      });

      expect(url).toContain('twitter.com/intent/tweet');
      expect(url).toContain('text=Hello');
      expect(url).toContain('url=https');
    });

    it('should have facebook configuration', () => {
      const url = share.socialPlatforms.facebook.shareUrl({
        url: 'https://example.com',
      });

      expect(url).toContain('facebook.com/sharer');
      expect(url).toContain('u=https');
    });

    it('should have linkedin configuration', () => {
      const url = share.socialPlatforms.linkedin.shareUrl({
        title: 'Test',
        url: 'https://example.com',
      });

      expect(url).toContain('linkedin.com/shareArticle');
      expect(url).toContain('title=Test');
    });

    it('should have whatsapp configuration', () => {
      const url = share.socialPlatforms.whatsapp.shareUrl({
        text: 'Check this out',
        url: 'https://example.com',
      });

      expect(url).toContain('wa.me');
    });

    it('should have telegram configuration', () => {
      const url = share.socialPlatforms.telegram.shareUrl({
        url: 'https://example.com',
      });

      expect(url).toContain('t.me/share');
    });

    it('should have email configuration', () => {
      const url = share.socialPlatforms.email.shareUrl({
        title: 'Subject',
        text: 'Body text',
      });

      expect(url).toContain('mailto:');
      expect(url).toContain('subject=Subject');
    });
  });

  describe('shareToSocial', () => {
    it('should open share URL in new window', () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

      share.shareToSocial('twitter', {
        text: 'Hello',
        url: 'https://example.com',
      });

      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com'),
        'share',
        expect.any(String)
      );
    });

    it('should navigate to URL when newWindow is false', () => {
      const originalHref = window.location.href;

      // Mock location
      const locationMock = { href: '' };
      Object.defineProperty(window, 'location', {
        value: locationMock,
        writable: true,
      });

      share.shareToSocial('email', { title: 'Test' }, { newWindow: false });

      expect(locationMock.href).toContain('mailto:');

      // Restore
      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });
    });
  });

  describe('getSocialShareUrl', () => {
    it('should return share URL without opening it', () => {
      const url = share.getSocialShareUrl('reddit', {
        title: 'Test Post',
        url: 'https://example.com',
      });

      expect(url).toContain('reddit.com/submit');
      expect(url).toContain('title=Test');
    });
  });

  describe('createShareHandler', () => {
    it('should create click handler for element', async () => {
      const button = document.createElement('button');
      const onSuccess = vi.fn();

      const cleanup = share.createShareHandler(
        button,
        { title: 'Test', url: 'https://example.com' },
        { onSuccess }
      );

      // Simulate click
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // Wait for async share
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(navigator.share).toHaveBeenCalled();

      cleanup();
    });

    it('should support function for data', async () => {
      const button = document.createElement('button');
      const getData = vi.fn().mockReturnValue({ title: 'Dynamic' });

      share.createShareHandler(button, getData);

      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(getData).toHaveBeenCalled();
      expect(navigator.share).toHaveBeenCalledWith({ title: 'Dynamic' });
    });
  });

  describe('shareCurrentPage', () => {
    it('should share current page', async () => {
      // Set document title
      Object.defineProperty(document, 'title', {
        value: 'Test Page',
        writable: true,
      });

      // Create meta description
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Page description';
      document.head.appendChild(meta);

      await share.shareCurrentPage();

      expect(navigator.share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Page',
          text: 'Page description',
        })
      );

      document.head.removeChild(meta);
    });

    it('should exclude description when includeDescription is false', async () => {
      Object.defineProperty(document, 'title', {
        value: 'Test Page',
        writable: true,
      });

      await share.shareCurrentPage({ includeDescription: false });

      expect(navigator.share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Page',
        })
      );

      const callArg = (navigator.share as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(callArg.text).toBeUndefined();
    });
  });

  describe('createShareButtons', () => {
    it('should create buttons for specified platforms', () => {
      const container = document.createElement('div');

      const cleanup = share.createShareButtons(
        container,
        { title: 'Test', url: 'https://example.com' },
        ['twitter', 'facebook']
      );

      expect(container.querySelectorAll('button')).toHaveLength(2);
      expect(container.querySelector('.share-button-twitter')).not.toBeNull();
      expect(container.querySelector('.share-button-facebook')).not.toBeNull();

      cleanup();
      expect(container.innerHTML).toBe('');
    });

    it('should open share URL on button click', () => {
      const container = document.createElement('div');
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

      share.createShareButtons(
        container,
        { title: 'Test', url: 'https://example.com' },
        ['twitter']
      );

      const button = container.querySelector('button')!;
      button.click();

      expect(openSpy).toHaveBeenCalled();
    });
  });
});
