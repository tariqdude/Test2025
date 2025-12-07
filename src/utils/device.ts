/**
 * Device and Environment Detection Utilities
 * @module utils/device
 * @description Detect device type, capabilities, browser features,
 * and user preferences for responsive and accessible experiences.
 */

import { isBrowser } from './dom';

// ============================================================================
// Device Detection
// ============================================================================

/**
 * Device type
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Get the current device type based on viewport width
 */
export function getDeviceType(): DeviceType {
  if (!isBrowser()) return 'desktop';

  const width = window.innerWidth;

  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  return getDeviceType() === 'mobile';
}

/**
 * Check if device is tablet
 */
export function isTablet(): boolean {
  return getDeviceType() === 'tablet';
}

/**
 * Check if device is desktop
 */
export function isDesktop(): boolean {
  return getDeviceType() === 'desktop';
}

/**
 * Check if device has touch capability
 */
export function isTouchDevice(): boolean {
  if (!isBrowser()) return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Check if device is a pointer device (mouse/trackpad)
 */
export function isPointerDevice(): boolean {
  if (!isBrowser()) return true;
  return window.matchMedia('(pointer: fine)').matches;
}

/**
 * Check if device supports hover
 */
export function supportsHover(): boolean {
  if (!isBrowser()) return true;
  return window.matchMedia('(hover: hover)').matches;
}

// ============================================================================
// Browser Detection
// ============================================================================

/**
 * Browser information
 */
export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
}

/**
 * Get browser information
 */
export function getBrowser(): BrowserInfo {
  if (!isBrowser()) {
    return { name: 'unknown', version: '0', engine: 'unknown' };
  }

  const ua = navigator.userAgent;

  // Detect browser name and version
  let name = 'unknown';
  let version = '0';
  let engine = 'unknown';

  if (ua.includes('Firefox/')) {
    name = 'Firefox';
    version = ua.match(/Firefox\/([\d.]+)/)?.[1] || '0';
    engine = 'Gecko';
  } else if (ua.includes('Edg/')) {
    name = 'Edge';
    version = ua.match(/Edg\/([\d.]+)/)?.[1] || '0';
    engine = 'Blink';
  } else if (ua.includes('Chrome/')) {
    name = 'Chrome';
    version = ua.match(/Chrome\/([\d.]+)/)?.[1] || '0';
    engine = 'Blink';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    name = 'Safari';
    version = ua.match(/Version\/([\d.]+)/)?.[1] || '0';
    engine = 'WebKit';
  } else if (ua.includes('Opera') || ua.includes('OPR/')) {
    name = 'Opera';
    version = ua.match(/(?:Opera|OPR)\/([\d.]+)/)?.[1] || '0';
    engine = 'Blink';
  }

  return { name, version, engine };
}

/**
 * Check if browser is Chrome
 */
export function isChrome(): boolean {
  return getBrowser().name === 'Chrome';
}

/**
 * Check if browser is Firefox
 */
export function isFirefox(): boolean {
  return getBrowser().name === 'Firefox';
}

/**
 * Check if browser is Safari
 */
export function isSafari(): boolean {
  return getBrowser().name === 'Safari';
}

/**
 * Check if browser is Edge
 */
export function isEdge(): boolean {
  return getBrowser().name === 'Edge';
}

// ============================================================================
// Operating System Detection
// ============================================================================

/**
 * Operating system type
 */
export type OSType =
  | 'windows'
  | 'macos'
  | 'linux'
  | 'ios'
  | 'android'
  | 'unknown';

/**
 * Get the operating system
 */
export function getOS(): OSType {
  if (!isBrowser()) return 'unknown';

  const ua = navigator.userAgent;
  const platform = navigator.platform?.toLowerCase() || '';

  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/mac/i.test(platform)) return 'macos';
  if (/win/i.test(platform)) return 'windows';
  if (/linux/i.test(platform)) return 'linux';

  return 'unknown';
}

/**
 * Check if OS is Windows
 */
export function isWindows(): boolean {
  return getOS() === 'windows';
}

/**
 * Check if OS is macOS
 */
export function isMacOS(): boolean {
  return getOS() === 'macos';
}

/**
 * Check if OS is iOS
 */
export function isIOS(): boolean {
  return getOS() === 'ios';
}

/**
 * Check if OS is Android
 */
export function isAndroid(): boolean {
  return getOS() === 'android';
}

/**
 * Check if OS is Linux
 */
export function isLinux(): boolean {
  return getOS() === 'linux';
}

// ============================================================================
// User Preferences
// ============================================================================

/**
 * Check if user prefers dark mode
 */
export function prefersDarkMode(): boolean {
  if (!isBrowser()) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Check if user prefers light mode
 */
export function prefersLightMode(): boolean {
  if (!isBrowser()) return false;
  return window.matchMedia('(prefers-color-scheme: light)').matches;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (!isBrowser()) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers reduced transparency
 */
export function prefersReducedTransparency(): boolean {
  if (!isBrowser()) return false;
  return window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
}

/**
 * Check if user prefers more contrast
 */
export function prefersContrast(): 'more' | 'less' | 'no-preference' {
  if (!isBrowser()) return 'no-preference';

  if (window.matchMedia('(prefers-contrast: more)').matches) return 'more';
  if (window.matchMedia('(prefers-contrast: less)').matches) return 'less';
  return 'no-preference';
}

/**
 * Watch for preference changes
 * @param preference - Preference to watch
 * @param callback - Callback when preference changes
 * @returns Cleanup function
 */
export function watchPreference(
  preference:
    | 'color-scheme'
    | 'reduced-motion'
    | 'reduced-transparency'
    | 'contrast',
  callback: (matches: boolean | string) => void
): () => void {
  if (!isBrowser()) return () => {};

  let query: MediaQueryList;

  switch (preference) {
    case 'color-scheme':
      query = window.matchMedia('(prefers-color-scheme: dark)');
      break;
    case 'reduced-motion':
      query = window.matchMedia('(prefers-reduced-motion: reduce)');
      break;
    case 'reduced-transparency':
      query = window.matchMedia('(prefers-reduced-transparency: reduce)');
      break;
    case 'contrast':
      query = window.matchMedia('(prefers-contrast: more)');
      break;
  }

  const handler = (e: MediaQueryListEvent) => callback(e.matches);
  query.addEventListener('change', handler);

  return () => query.removeEventListener('change', handler);
}

// ============================================================================
// Feature Detection
// ============================================================================

/**
 * Feature detection results
 */
export interface Features {
  webGL: boolean;
  webGL2: boolean;
  webGPU: boolean;
  webWorkers: boolean;
  serviceWorkers: boolean;
  webSockets: boolean;
  webRTC: boolean;
  webAudio: boolean;
  webAssembly: boolean;
  indexedDB: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  geolocation: boolean;
  notifications: boolean;
  clipboard: boolean;
  share: boolean;
  bluetooth: boolean;
  usb: boolean;
  gamepad: boolean;
  vibration: boolean;
  battery: boolean;
  networkInfo: boolean;
  mediaRecorder: boolean;
  speechRecognition: boolean;
  speechSynthesis: boolean;
}

/**
 * Detect available browser features
 */
export function detectFeatures(): Features {
  if (!isBrowser()) {
    return {
      webGL: false,
      webGL2: false,
      webGPU: false,
      webWorkers: false,
      serviceWorkers: false,
      webSockets: false,
      webRTC: false,
      webAudio: false,
      webAssembly: false,
      indexedDB: false,
      localStorage: false,
      sessionStorage: false,
      geolocation: false,
      notifications: false,
      clipboard: false,
      share: false,
      bluetooth: false,
      usb: false,
      gamepad: false,
      vibration: false,
      battery: false,
      networkInfo: false,
      mediaRecorder: false,
      speechRecognition: false,
      speechSynthesis: false,
    };
  }

  const checkWebGL = (version: 1 | 2): boolean => {
    try {
      const canvas = document.createElement('canvas');
      const context = version === 2 ? 'webgl2' : 'webgl';
      return !!canvas.getContext(context);
    } catch {
      return false;
    }
  };

  return {
    webGL: checkWebGL(1),
    webGL2: checkWebGL(2),
    webGPU: 'gpu' in navigator,
    webWorkers: 'Worker' in window,
    serviceWorkers: 'serviceWorker' in navigator,
    webSockets: 'WebSocket' in window,
    webRTC: 'RTCPeerConnection' in window,
    webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
    webAssembly: 'WebAssembly' in window,
    indexedDB: 'indexedDB' in window,
    localStorage: (() => {
      try {
        return 'localStorage' in window && localStorage !== null;
      } catch {
        return false;
      }
    })(),
    sessionStorage: (() => {
      try {
        return 'sessionStorage' in window && sessionStorage !== null;
      } catch {
        return false;
      }
    })(),
    geolocation: 'geolocation' in navigator,
    notifications: 'Notification' in window,
    clipboard: 'clipboard' in navigator,
    share: 'share' in navigator,
    bluetooth: 'bluetooth' in navigator,
    usb: 'usb' in navigator,
    gamepad: 'getGamepads' in navigator,
    vibration: 'vibrate' in navigator,
    battery: 'getBattery' in navigator,
    networkInfo: 'connection' in navigator,
    mediaRecorder: 'MediaRecorder' in window,
    speechRecognition:
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    speechSynthesis: 'speechSynthesis' in window,
  };
}

/**
 * Check if a specific feature is supported
 */
export function hasFeature(feature: keyof Features): boolean {
  return detectFeatures()[feature];
}

// ============================================================================
// Screen and Display
// ============================================================================

/**
 * Screen information
 */
export interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
}

/**
 * Get screen information
 */
export function getScreenInfo(): ScreenInfo {
  if (!isBrowser()) {
    return {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1080,
      colorDepth: 24,
      pixelRatio: 1,
      orientation: 'landscape',
    };
  }

  return {
    width: screen.width,
    height: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
    orientation:
      window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
  };
}

/**
 * Watch for orientation changes
 */
export function watchOrientation(
  callback: (orientation: 'portrait' | 'landscape') => void
): () => void {
  if (!isBrowser()) return () => {};

  const handler = () => {
    const orientation =
      window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    callback(orientation);
  };

  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}

/**
 * Check if display is in standalone mode (PWA)
 */
export function isStandalone(): boolean {
  if (!isBrowser()) return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error - iOS Safari specific
    window.navigator.standalone === true
  );
}

/**
 * Check if running in an iframe
 */
export function isInIframe(): boolean {
  if (!isBrowser()) return false;

  try {
    return window.self !== window.top;
  } catch {
    return true; // If access is blocked, we're likely in an iframe
  }
}

// ============================================================================
// Performance and Memory
// ============================================================================

/**
 * Get device memory (if available)
 * Returns approximate RAM in GB
 */
export function getDeviceMemory(): number | null {
  if (!isBrowser()) return null;

  // @ts-expect-error - deviceMemory is not in all browsers
  return navigator.deviceMemory ?? null;
}

/**
 * Get hardware concurrency (number of CPU cores)
 */
export function getHardwareConcurrency(): number {
  if (!isBrowser()) return 4;
  return navigator.hardwareConcurrency || 4;
}

/**
 * Check if device is low-end based on available metrics
 */
export function isLowEndDevice(): boolean {
  if (!isBrowser()) return false;

  const memory = getDeviceMemory();
  const cores = getHardwareConcurrency();
  const hasSlowConnection =
    // @ts-expect-error - connection API
    navigator.connection?.effectiveType === '2g' ||
    // @ts-expect-error - connection API
    navigator.connection?.effectiveType === 'slow-2g';

  // Consider low-end if:
  // - Less than 4GB RAM
  // - 2 or fewer cores
  // - On a slow connection
  return (memory !== null && memory < 4) || cores <= 2 || hasSlowConnection;
}

/**
 * Get comprehensive device info
 */
export function getDeviceInfo() {
  return {
    type: getDeviceType(),
    os: getOS(),
    browser: getBrowser(),
    screen: getScreenInfo(),
    touch: isTouchDevice(),
    hover: supportsHover(),
    memory: getDeviceMemory(),
    cores: getHardwareConcurrency(),
    lowEnd: isLowEndDevice(),
    standalone: isStandalone(),
    features: detectFeatures(),
    preferences: {
      darkMode: prefersDarkMode(),
      reducedMotion: prefersReducedMotion(),
      reducedTransparency: prefersReducedTransparency(),
      contrast: prefersContrast(),
    },
  };
}
