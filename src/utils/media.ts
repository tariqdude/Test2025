/**
 * Media and Device Utilities
 * Responsive design, device detection, viewport management
 */

// ============================================================================
// BREAKPOINTS
// ============================================================================

/**
 * Default breakpoints (matches Tailwind CSS defaults)
 */
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'lg';

  const width = window.innerWidth;

  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

/**
 * Check if current viewport matches a breakpoint
 */
export function matchesBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints[breakpoint];
}

/**
 * Check if viewport is between two breakpoints
 */
export function isBetweenBreakpoints(
  min: Breakpoint,
  max: Breakpoint
): boolean {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= breakpoints[min] && width < breakpoints[max];
}

/**
 * Watch for breakpoint changes
 */
export function watchBreakpoint(
  callback: (breakpoint: Breakpoint, prevBreakpoint: Breakpoint) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  let currentBreakpoint = getCurrentBreakpoint();

  const handleResize = () => {
    const newBreakpoint = getCurrentBreakpoint();
    if (newBreakpoint !== currentBreakpoint) {
      const prev = currentBreakpoint;
      currentBreakpoint = newBreakpoint;
      callback(newBreakpoint, prev);
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}

// ============================================================================
// MEDIA QUERIES
// ============================================================================

/**
 * Create a media query matcher
 */
export function createMediaQuery(query: string): {
  matches: boolean;
  subscribe: (callback: (matches: boolean) => void) => () => void;
} {
  if (typeof window === 'undefined') {
    return {
      matches: false,
      subscribe: () => () => {},
    };
  }

  const mediaQuery = window.matchMedia(query);

  return {
    get matches() {
      return mediaQuery.matches;
    },
    subscribe(callback: (matches: boolean) => void) {
      const handler = (e: MediaQueryListEvent) => callback(e.matches);

      // Use modern API (legacy addListener/removeListener are deprecated)
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    },
  };
}

/**
 * Common media queries
 */
export const mediaQueries = {
  mobile: createMediaQuery('(max-width: 639px)'),
  tablet: createMediaQuery('(min-width: 640px) and (max-width: 1023px)'),
  desktop: createMediaQuery('(min-width: 1024px)'),
  portrait: createMediaQuery('(orientation: portrait)'),
  landscape: createMediaQuery('(orientation: landscape)'),
  dark: createMediaQuery('(prefers-color-scheme: dark)'),
  light: createMediaQuery('(prefers-color-scheme: light)'),
  reducedMotion: createMediaQuery('(prefers-reduced-motion: reduce)'),
  highContrast: createMediaQuery('(prefers-contrast: more)'),
  touch: createMediaQuery('(hover: none) and (pointer: coarse)'),
  mouse: createMediaQuery('(hover: hover) and (pointer: fine)'),
  retina: createMediaQuery(
    '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)'
  ),
} as const;

// ============================================================================
// DEVICE DETECTION
// ============================================================================

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  isMouse: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isIE: boolean;
  browser: string;
  os: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Get comprehensive device information
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouch: false,
      isMouse: true,
      isIOS: false,
      isAndroid: false,
      isMac: false,
      isWindows: false,
      isLinux: false,
      isSafari: false,
      isChrome: false,
      isFirefox: false,
      isEdge: false,
      isIE: false,
      browser: 'unknown',
      os: 'unknown',
      deviceType: 'desktop',
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();

  // OS detection
  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (platform === 'macintel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(ua);
  const isMac = /mac/.test(platform) && !isIOS;
  const isWindows = /win/.test(platform);
  const isLinux = /linux/.test(platform) && !isAndroid;

  // Browser detection
  const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
  const isChrome = /chrome/.test(ua) && !/edge/.test(ua);
  const isFirefox = /firefox/.test(ua);
  const isEdge = /edg/.test(ua);
  const isIE = /msie|trident/.test(ua);

  // Device type detection
  const isMobile =
    /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet =
    /ipad|android(?!.*mobile)/i.test(ua) ||
    (isIOS && navigator.maxTouchPoints > 1);
  const isDesktop = !isMobile && !isTablet;

  // Touch capability
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMouse =
    window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? true;

  // Determine browser name
  let browser = 'unknown';
  if (isChrome) browser = 'chrome';
  else if (isSafari) browser = 'safari';
  else if (isFirefox) browser = 'firefox';
  else if (isEdge) browser = 'edge';
  else if (isIE) browser = 'ie';

  // Determine OS name
  let os = 'unknown';
  if (isIOS) os = 'ios';
  else if (isAndroid) os = 'android';
  else if (isMac) os = 'macos';
  else if (isWindows) os = 'windows';
  else if (isLinux) os = 'linux';

  // Determine device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (isMobile) deviceType = 'mobile';
  else if (isTablet) deviceType = 'tablet';

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    isMouse,
    isIOS,
    isAndroid,
    isMac,
    isWindows,
    isLinux,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    isIE,
    browser,
    os,
    deviceType,
  };
}

/**
 * Check if the device is a mobile device
 */
export function isMobile(): boolean {
  return getDeviceInfo().isMobile;
}

/**
 * Check if the device is a tablet
 */
export function isTablet(): boolean {
  return getDeviceInfo().isTablet;
}

/**
 * Check if the device is a desktop
 */
export function isDesktop(): boolean {
  return getDeviceInfo().isDesktop;
}

/**
 * Check if device supports touch
 */
export function hasTouch(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ============================================================================
// VIEWPORT UTILITIES
// ============================================================================

export interface ViewportSize {
  width: number;
  height: number;
  aspectRatio: number;
  isPortrait: boolean;
  isLandscape: boolean;
}

/**
 * Get current viewport size
 */
export function getViewportSize(): ViewportSize {
  if (typeof window === 'undefined') {
    return {
      width: 1024,
      height: 768,
      aspectRatio: 1024 / 768,
      isPortrait: false,
      isLandscape: true,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    width,
    height,
    aspectRatio: width / height,
    isPortrait: height > width,
    isLandscape: width >= height,
  };
}

/**
 * Watch viewport size changes
 */
export function watchViewportSize(
  callback: (size: ViewportSize) => void,
  debounceMs = 100
): () => void {
  if (typeof window === 'undefined') return () => {};

  let timeoutId: ReturnType<typeof setTimeout>;

  const handleResize = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(getViewportSize());
    }, debounceMs);
  };

  window.addEventListener('resize', handleResize);
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * Get document dimensions
 */
export function getDocumentSize(): { width: number; height: number } {
  if (typeof document === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
      document.documentElement.clientWidth
    ),
    height: Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
    ),
  };
}

/**
 * Check if viewport is scrollable
 */
export function isScrollable(): boolean {
  if (typeof document === 'undefined') return false;

  const { height: docHeight } = getDocumentSize();
  const { height: viewportHeight } = getViewportSize();

  return docHeight > viewportHeight;
}

// ============================================================================
// NETWORK INFORMATION
// ============================================================================

export interface NetworkInfo {
  online: boolean;
  type: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

/**
 * Get network information
 */
export function getNetworkInfo(): NetworkInfo {
  const defaultInfo: NetworkInfo = {
    online: true,
    type: 'unknown',
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false,
  };

  if (typeof navigator === 'undefined') return defaultInfo;

  const connection = (
    navigator as Navigator & {
      connection?: {
        type?: string;
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        saveData?: boolean;
      };
    }
  ).connection;

  return {
    online: navigator.onLine,
    type: connection?.type ?? 'unknown',
    effectiveType: connection?.effectiveType ?? '4g',
    downlink: connection?.downlink ?? 10,
    rtt: connection?.rtt ?? 100,
    saveData: connection?.saveData ?? false,
  };
}

/**
 * Check if network is slow
 */
export function isSlowNetwork(): boolean {
  const { effectiveType, saveData } = getNetworkInfo();
  return saveData || ['slow-2g', '2g', '3g'].includes(effectiveType);
}

/**
 * Watch network status
 */
export function watchNetworkStatus(
  callback: (info: NetworkInfo) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const update = () => callback(getNetworkInfo());

  window.addEventListener('online', update);
  window.addEventListener('offline', update);

  const connection = (
    navigator as Navigator & {
      connection?: EventTarget;
    }
  ).connection;

  if (connection) {
    connection.addEventListener('change', update);
  }

  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
    if (connection) {
      connection.removeEventListener('change', update);
    }
  };
}

// ============================================================================
// VISIBILITY UTILITIES
// ============================================================================

export type VisibilityState = 'visible' | 'hidden' | 'prerender';

/**
 * Get current document visibility state
 */
export function getVisibilityState(): VisibilityState {
  if (typeof document === 'undefined') return 'visible';
  return document.visibilityState as VisibilityState;
}

/**
 * Check if document is visible
 */
export function isDocumentVisible(): boolean {
  return getVisibilityState() === 'visible';
}

/**
 * Watch document visibility changes
 */
export function watchVisibility(
  callback: (isVisible: boolean, state: VisibilityState) => void
): () => void {
  if (typeof document === 'undefined') return () => {};

  const handleChange = () => {
    callback(!document.hidden, getVisibilityState());
  };

  document.addEventListener('visibilitychange', handleChange);
  return () => document.removeEventListener('visibilitychange', handleChange);
}

// ============================================================================
// FULLSCREEN UTILITIES
// ============================================================================

/**
 * Check if fullscreen is supported
 */
export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;

  const doc = document as Document & {
    fullscreenEnabled?: boolean;
    webkitFullscreenEnabled?: boolean;
    mozFullScreenEnabled?: boolean;
    msFullscreenEnabled?: boolean;
  };

  return !!(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled
  );
}

/**
 * Check if currently in fullscreen mode
 */
export function isFullscreen(): boolean {
  if (typeof document === 'undefined') return false;

  const doc = document as Document & {
    fullscreenElement?: Element | null;
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };

  return !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

/**
 * Request fullscreen for an element
 */
export async function requestFullscreen(element?: Element): Promise<void> {
  const el = element ?? document.documentElement;

  const requestMethods = [
    'requestFullscreen',
    'webkitRequestFullscreen',
    'mozRequestFullScreen',
    'msRequestFullscreen',
  ] as const;

  for (const method of requestMethods) {
    if (method in el) {
      await (el as Element & { [key: string]: () => Promise<void> })[method]();
      return;
    }
  }

  throw new Error('Fullscreen not supported');
}

/**
 * Exit fullscreen mode
 */
export async function exitFullscreen(): Promise<void> {
  if (!isFullscreen()) return;

  const doc = document as Document & {
    exitFullscreen?: () => Promise<void>;
    webkitExitFullscreen?: () => Promise<void>;
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  };

  if (doc.exitFullscreen) await doc.exitFullscreen();
  else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
  else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen();
  else if (doc.msExitFullscreen) await doc.msExitFullscreen();
}

/**
 * Toggle fullscreen mode
 */
export async function toggleFullscreen(element?: Element): Promise<void> {
  if (isFullscreen()) {
    await exitFullscreen();
  } else {
    await requestFullscreen(element);
  }
}

/**
 * Watch fullscreen changes
 */
export function watchFullscreen(
  callback: (isFullscreen: boolean) => void
): () => void {
  if (typeof document === 'undefined') return () => {};

  const events = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange',
  ];

  const handleChange = () => callback(isFullscreen());

  events.forEach(event => {
    document.addEventListener(event, handleChange);
  });

  return () => {
    events.forEach(event => {
      document.removeEventListener(event, handleChange);
    });
  };
}

// ============================================================================
// SCREEN ORIENTATION
// ============================================================================

export type Orientation =
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

/**
 * Get current screen orientation
 */
export function getOrientation(): Orientation {
  if (typeof screen === 'undefined' || !screen.orientation) {
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth
        ? 'portrait-primary'
        : 'landscape-primary';
    }
    return 'landscape-primary';
  }

  return screen.orientation.type as Orientation;
}

/**
 * Lock screen orientation
 */
export async function lockOrientation(
  orientation:
    | 'any'
    | 'natural'
    | 'landscape'
    | 'portrait'
    | 'portrait-primary'
    | 'portrait-secondary'
    | 'landscape-primary'
    | 'landscape-secondary'
): Promise<void> {
  if (typeof screen === 'undefined' || !screen.orientation) {
    throw new Error('Screen orientation lock not supported');
  }

  const orientationAPI = screen.orientation as ScreenOrientation & {
    lock?: (orientation: string) => Promise<void>;
  };

  if (!orientationAPI.lock) {
    throw new Error('Screen orientation lock not supported');
  }

  await orientationAPI.lock(orientation);
}

/**
 * Unlock screen orientation
 */
export function unlockOrientation(): void {
  if (typeof screen !== 'undefined' && screen.orientation?.unlock) {
    screen.orientation.unlock();
  }
}

/**
 * Watch orientation changes
 */
export function watchOrientation(
  callback: (orientation: Orientation) => void
): () => void {
  if (typeof screen === 'undefined') return () => {};

  const handleChange = () => callback(getOrientation());

  if (screen.orientation) {
    screen.orientation.addEventListener('change', handleChange);
    return () => screen.orientation.removeEventListener('change', handleChange);
  }

  // Fallback for older browsers
  window.addEventListener('orientationchange', handleChange);
  return () => window.removeEventListener('orientationchange', handleChange);
}

// ============================================================================
// PIXEL DENSITY
// ============================================================================

/**
 * Get device pixel ratio
 */
export function getPixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Check if device has high DPI (retina) display
 */
export function isHighDPI(): boolean {
  return getPixelRatio() >= 2;
}

/**
 * Get appropriate image size suffix based on DPI
 */
export function getImageDPISuffix(): '' | '@2x' | '@3x' {
  const ratio = getPixelRatio();
  if (ratio >= 3) return '@3x';
  if (ratio >= 2) return '@2x';
  return '';
}
