// Modern utility functions for enhanced development experience

// Export analysis cache utility
export { AnalysisCache } from './analysis-cache';

// Export cache utilities
export { MemoryCache, createCache, memoizeWithCache } from './cache';

// Export analytics tracker
export { analytics } from './analytics-tracker';

/* ==================== EVENTS UTILITIES ==================== */

export {
  EventEmitter,
  eventBus,
  createNamespacedEmitter,
  customEvents,
  Observable,
  observable,
  combineObservables,
  delegateEvent,
  onKeyboardShortcut,
  parseShortcut,
  registerShortcuts,
  onMediaQueryChange,
  onVisibilityChange,
  onOnlineStatusChange,
  onResize,
  onScroll,
  onIdle,
} from './events';
import {
  EventEmitter,
  eventBus,
  observable,
  onKeyboardShortcut,
  onMediaQueryChange,
  onVisibilityChange,
} from './events';

/* ==================== CRYPTO UTILITIES ==================== */

export {
  hasCrypto,
  uuid,
  shortId,
  nanoId,
  randomBytes,
  bytesToHex,
  hexToBytes,
  stringToBytes,
  bytesToString,
  bytesToBase64,
  base64ToBytes,
  base64UrlEncode,
  base64UrlDecode,
  hash,
  sha256,
  sha512,
  simpleHash,
  djb2Hash,
  fnv1aHash,
  hmacSign,
  hmacVerify,
  timingSafeEqual,
  encrypt,
  decrypt,
  generateKeyPair,
  generatePassword,
  checkPasswordStrength,
  generateOTPSecret,
  generateTOTP,
  verifyTOTP,
  checksum,
  crc32,
  obfuscate,
  deobfuscate,
  generateFingerprint,
} from './crypto';
import {
  uuid,
  shortId,
  nanoId,
  sha256,
  simpleHash,
  generatePassword,
  checkPasswordStrength,
} from './crypto';

/* ==================== HTTP CLIENT UTILITIES ==================== */

export {
  HttpError,
  TimeoutError,
  buildUrl as buildHttpUrl,
  request,
  get,
  post,
  put,
  patch,
  del,
  head,
  options,
  createClient,
  createInterceptorClient,
  createResource,
  uploadFile,
  downloadFile,
  triggerDownload,
  createGraphQLClient,
  createSSEClient,
  poll,
} from './http';
import {
  request,
  get,
  post,
  createClient,
  createResource,
  uploadFile,
  downloadFile,
} from './http';

/* ==================== ACCESSIBILITY UTILITIES ==================== */

export {
  createAnnouncer,
  announce,
  announceAssertive,
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
  createFocusTrap as createA11yFocusTrap,
  createSkipLink,
  isAccessiblyHidden,
  getAccessibleName,
  setAriaAttributes,
  createTooltip,
  createRovingTabIndex,
  prefersReducedMotion,
  onReducedMotionChange,
  prefersHighContrast,
  prefersColorScheme,
  createAccessibleDialog,
  createLiveRegion,
  getContrastRatio,
  checkWcagCompliance,
} from './a11y';
import {
  announce,
  getFocusableElements,
  createSkipLink,
  setAriaAttributes,
  prefersReducedMotion,
  prefersColorScheme,
  getContrastRatio,
  checkWcagCompliance,
} from './a11y';

/* ==================== MEDIA & DEVICE UTILITIES ==================== */

export {
  breakpoints,
  getCurrentBreakpoint,
  matchesBreakpoint,
  isBetweenBreakpoints,
  watchBreakpoint,
  createMediaQuery,
  mediaQueries,
  getDeviceInfo,
  isMobile,
  isTablet,
  isDesktop,
  hasTouch,
  getViewportSize,
  watchViewportSize,
  getDocumentSize,
  isScrollable,
  getNetworkInfo,
  isSlowNetwork,
  watchNetworkStatus,
  getVisibilityState,
  isDocumentVisible,
  watchVisibility,
  isFullscreenSupported,
  isFullscreen,
  requestFullscreen,
  exitFullscreen,
  toggleFullscreen,
  watchFullscreen,
  getOrientation,
  lockOrientation,
  unlockOrientation,
  watchOrientation,
  getPixelRatio,
  isHighDPI,
  getImageDPISuffix,
} from './media';
import {
  getCurrentBreakpoint,
  matchesBreakpoint,
  mediaQueries,
  getDeviceInfo,
  isMobile,
  getViewportSize,
  getNetworkInfo,
  isFullscreen,
  toggleFullscreen,
} from './media';

/* ==================== FORMATTING UTILITIES ==================== */

export {
  formatDate,
  formatRelativeTime,
  parseDate,
  isValidDate,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addTime,
  subtractTime,
  dateDiff,
  isToday,
  isYesterday,
  isTomorrow,
  isPast,
  isFuture,
  isWeekend,
  isWeekday,
  isLeapYear,
  getDaysInMonth,
  getDaysInYear,
  getWeekNumber,
  getQuarter,
  isSameDay,
  isSameMonth,
  isSameYear,
  isBetween,
  getAge,
  formatDuration,
  getDateRange,
  getClosestDate,
  formatTime,
  getTimezoneOffset,
  toISODateString,
  fromISODateString,
} from './date';
import {
  formatDate,
  formatRelativeTime,
  isToday,
  formatDuration,
} from './date';

export { formatNumber, formatFileSize } from './format';
import { formatNumber, formatFileSize } from './format';

/* ==================== STRING UTILITIES ==================== */

export {
  slugify,
  truncate,
  titleCase,
  capitalizeFirst,
  getInitials,
  sanitizeInput,
  escapeHtml,
  camelCase,
  snakeCase,
  kebabCase,
  pascalCase,
  pluralize,
  wordCount,
  reverseString,
  maskString,
  normalizeWhitespace,
  stripHtml,
  extractNumbers,
  extractEmails,
  extractUrls,
  isUpperCase,
  isLowerCase,
  padString,
  countOccurrences,
  isPalindrome,
  randomString,
  wrapText,
  sentenceCase,
  removeAccents,
  isAlphanumeric,
  levenshteinDistance,
  stringSimilarity,
} from './string';
import {
  slugify,
  truncate,
  titleCase,
  capitalizeFirst,
  getInitials,
  sanitizeInput,
  escapeHtml,
  camelCase,
  snakeCase,
  kebabCase,
  maskString,
  stripHtml,
  randomString,
} from './string';

/* ==================== ARRAY UTILITIES ==================== */

export {
  unique,
  groupBy,
  chunk,
  shuffle,
  flatten,
  intersection,
  difference,
  union,
  partition,
  findWithIndex,
  last,
  first,
  take,
  drop,
  range,
  uniqueBy,
  countBy,
  sum,
  average,
  minBy,
  maxBy,
  zip,
  keyBy,
  sample,
  compact,
  sortBy,
} from './array';
import {
  unique,
  groupBy,
  chunk,
  shuffle,
  flatten,
  intersection,
  difference,
  union,
  partition,
  first,
  last,
  range,
  sum,
  average,
  sample,
  compact,
} from './array';

/* ==================== OBJECT UTILITIES ==================== */

export {
  deepMerge,
  pick,
  omit,
  deepClone,
  deepFreeze,
  deepEqual,
  flattenObject,
  unflattenObject,
  getByPath,
  setByPath,
  deleteByPath,
  mapValues,
  mapKeys,
  filterObject,
  invert,
  hasPath,
  fromEntries,
  entries,
  keys,
  values,
} from './object';
import {
  deepMerge,
  pick,
  omit,
  deepClone,
  deepEqual,
  getByPath,
  setByPath,
  mapValues,
  filterObject,
} from './object';

/* ==================== URL AND QUERY UTILITIES ==================== */

export { buildUrl, parseQuery, withBasePath, resolveHref } from './url';
import { buildUrl, parseQuery } from './url';

/* ==================== CSS UTILITIES ==================== */

export { cn, cssVariables } from './css';
import { cn, cssVariables } from './css';

/* ==================== BLOG UTILITIES ==================== */

export { extractExcerpt, filterPosts } from './blog';
import { extractExcerpt, filterPosts } from './blog';

// Re-export calculateReadingTime from reading-time.ts
// Note: This changes the return type from number to ReadingTimeResult compared to the old inline version
export { calculateReadingTime } from './reading-time';
import { calculateReadingTime } from './reading-time';

/* ==================== THEME UTILITIES ==================== */

export { getPreferredColorScheme, applyColorScheme } from './theme';
import { getPreferredColorScheme, applyColorScheme } from './theme';

/* ==================== PERFORMANCE/FUNCTION UTILITIES ==================== */

export {
  debounce,
  throttle,
  debounceLeading,
  throttleTrailing,
  memoize,
  memoizeLRU,
  once,
  negate,
  compose,
  pipe,
  curry,
  partial,
  after,
  before,
  rateLimit,
  delay,
  tryCatch,
  noop,
  identity,
  constant,
  times,
} from './function';
import {
  debounce,
  throttle,
  memoize,
  once,
  compose,
  pipe,
  noop,
  identity,
} from './function';

export { measureTime } from './performance-utils';
import { measureTime } from './performance-utils';

/* ==================== MATH UTILITIES ==================== */

export {
  clamp,
  lerp,
  easeInOut,
  roundTo,
  mapRange,
  inRange,
  randomBetween,
  randomIntBetween,
  percentage,
  fromPercentage,
  gcd,
  lcm,
  isPrime,
  factorial,
  fibonacci,
  mean,
  median,
  mode,
  standardDeviation,
  variance,
  normalize,
  denormalize,
  distance,
  angle,
  degreesToRadians,
  radiansToDegrees,
  easing,
  smoothstep,
  wrap,
} from './math';
import {
  clamp,
  lerp,
  roundTo,
  randomBetween,
  randomIntBetween,
  mean,
  median,
  distance,
  easing,
} from './math';

/* ==================== COLOR UTILITIES ==================== */

export {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  hexToHsl,
  hslToHex,
  lighten,
  darken,
  saturate,
  desaturate,
  setOpacity,
  mixColors,
  complementary,
  triadic,
  analogous,
  splitComplementary,
  relativeLuminance,
  contrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  isLight,
  getContrastTextColor,
  generatePalette,
  parseColor,
  randomColor,
  randomColorInHueRange,
} from './color';
import {
  hexToRgb,
  rgbToHex,
  lighten,
  darken,
  mixColors,
  isLight,
  getContrastTextColor,
  randomColor,
} from './color';

/* ==================== VALIDATION UTILITIES ==================== */

export { isValidEmail, isValidUrl, isEmpty, validatePhone } from './validation';
import { isValidEmail, isValidUrl, isEmpty } from './validation';

/* ==================== ASYNC UTILITIES ==================== */

export {
  sleep,
  retry,
  withTimeout,
  parallelLimit,
  sequential,
  waitUntil,
  memoizeAsync,
  PromisePool,
  defer,
  createDeferred,
  raceSuccess,
  backoffStrategies,
  retryWithBackoff,
} from './async';
import {
  sleep,
  retry,
  withTimeout,
  parallelLimit,
  sequential,
  waitUntil,
  PromisePool,
} from './async';

/* ==================== STORAGE UTILITIES ==================== */

export {
  isLocalStorageAvailable,
  isSessionStorageAvailable,
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
  clearLocalStorage,
  getLocalStorageKeys,
  getLocalStorageSize,
  setSessionStorage,
  getSessionStorage,
  removeSessionStorage,
  clearSessionStorage,
  setWithExpiry,
  getWithExpiry,
  cookies,
  createNamespacedStorage,
  SimpleDB,
} from './storage';
import {
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
  cookies,
  createNamespacedStorage,
} from './storage';

/* ==================== DOM UTILITIES ==================== */

export {
  isBrowser,
  $,
  $$,
  byId,
  createElement,
  on,
  once as onceEvent,
  delegate,
  ready,
  loaded,
  toggleClass,
  addClass,
  removeClass,
  hasClass,
  setCssVar,
  getCssVar,
  getRect,
  isInViewport,
  isPartiallyVisible,
  scrollIntoView,
  scrollToTop,
  getScrollPosition,
  lockScroll,
  getOffset,
  getOuterDimensions,
  insertAfter,
  removeElement,
  replaceElement,
  getSiblings,
  getNextSibling,
  getPrevSibling,
  getParents,
  wrapElement,
  unwrap,
  empty,
  clone,
  data,
  createFocusTrap,
  copyToClipboard,
  readFromClipboard,
  observeResize,
  observeIntersection,
  observeMutations,
  animate,
  fadeIn,
  fadeOut,
  printElement,
} from './dom';
import {
  isBrowser,
  $,
  $$,
  on,
  ready,
  scrollToTop,
  copyToClipboard,
  observeIntersection,
} from './dom';

/* ==================== DEFAULT EXPORT ==================== */

// Export all utilities as a single object for convenience
const utils = {
  // Events
  EventEmitter,
  eventBus,
  observable,
  onKeyboardShortcut,
  onMediaQueryChange,
  onVisibilityChange,

  // Crypto
  uuid,
  shortId,
  nanoId,
  sha256,
  simpleHash,
  generatePassword,
  checkPasswordStrength,

  // HTTP
  request,
  get,
  post,
  createClient,
  createResource,
  uploadFile,
  downloadFile,

  // Accessibility
  announce,
  getFocusableElements,
  createSkipLink,
  setAriaAttributes,
  prefersReducedMotion,
  prefersColorScheme,
  getContrastRatio,
  checkWcagCompliance,

  // Media & Device
  getCurrentBreakpoint,
  matchesBreakpoint,
  mediaQueries,
  getDeviceInfo,
  isMobile,
  getViewportSize,
  getNetworkInfo,
  isFullscreen,
  toggleFullscreen,

  // Formatting
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatFileSize,
  formatDuration,

  // Strings
  slugify,
  truncate,
  titleCase,
  capitalizeFirst,
  getInitials,
  sanitizeInput,
  escapeHtml,
  camelCase,
  snakeCase,
  kebabCase,
  maskString,
  stripHtml,
  randomString,

  // Arrays
  unique,
  groupBy,
  chunk,
  shuffle,
  flatten,
  intersection,
  difference,
  union,
  partition,
  first,
  last,
  range,
  sum,
  average,
  sample,
  compact,

  // Objects
  deepMerge,
  pick,
  omit,
  deepClone,
  deepEqual,
  getByPath,
  setByPath,
  mapValues,
  filterObject,

  // URLs
  buildUrl,
  parseQuery,

  // CSS
  cn,
  cssVariables,

  // Blog
  calculateReadingTime,
  extractExcerpt,
  filterPosts,

  // Theme
  getPreferredColorScheme,
  applyColorScheme,

  // Performance/Functions
  debounce,
  throttle,
  memoize,
  once,
  compose,
  pipe,
  measureTime,
  noop,
  identity,

  // Math
  clamp,
  lerp,
  roundTo,
  randomBetween,
  randomIntBetween,
  mean,
  median,
  distance,
  easing,

  // Colors
  hexToRgb,
  rgbToHex,
  lighten,
  darken,
  mixColors,
  isLight,
  getContrastTextColor,
  randomColor,

  // Validation
  isValidEmail,
  isValidUrl,
  isEmpty,
  isToday,

  // Async
  sleep,
  retry,
  withTimeout,
  parallelLimit,
  sequential,
  waitUntil,
  PromisePool,

  // Storage
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
  cookies,
  createNamespacedStorage,

  // DOM
  isBrowser,
  $,
  $$,
  on,
  ready,
  scrollToTop,
  copyToClipboard,
  observeIntersection,
};

/* ==================== COMPRESSION UTILITIES ==================== */

export {
  isCompressionSupported,
  compressString,
  decompressToString,
  compressToBase64,
  decompressFromBase64,
  compressionRatio,
  compressionSavings,
  rleEncode,
  rleDecode,
  lzCompress,
  lzDecompress,
  deltaEncode,
  deltaDecode,
  packBytes,
  unpackBytes,
  packBooleans,
  unpackBooleans,
  compressJSON,
  decompressJSON,
  deduplicateStrings,
  restoreStrings,
  buildHuffmanTable,
  huffmanEncode,
  huffmanDecode,
  estimateHuffmanRatio,
} from './compression';

/* ==================== DIFF UTILITIES ==================== */

export {
  diffChars,
  diffWords,
  diffLines,
  unifiedDiff,
  diffArrays,
  applyTextPatch,
  generateJSONPatch,
  applyJSONPatch,
  semanticDiff,
  diffStats,
  textsAreEqual,
  getChangedLines,
  highlightInlineChanges,
} from './diff';
export type {
  DiffOp,
  DiffEntry,
  DiffResult,
  LineDiffEntry,
  DiffHunk,
  ArrayDiffEntry,
  PatchOp,
  SemanticDiffOptions,
} from './diff';

/* ==================== COLLECTIONS UTILITIES ==================== */

export {
  PriorityQueue,
  MaxPriorityQueue,
  LRUCache,
  LFUCache,
  CircularBuffer,
  Deque,
  BloomFilter,
  Trie,
  DisjointSet,
  IntervalTree,
  memoizeWithLRU,
  slidingWindow,
  createMovingAverage,
} from './collections';
export type { PriorityItem, Interval, IntervalData } from './collections';

/* ==================== RESILIENCE UTILITIES ==================== */

export {
  CircuitBreaker,
  CircuitBreakerOpenError,
  withCircuitBreaker,
  retry as retryAsync,
  withRetry,
  RetryError,
  AbortError,
  RateLimiter,
  RateLimitExceededError,
  withRateLimit,
  Bulkhead,
  BulkheadFullError,
  BulkheadTimeoutError,
  withBulkhead,
  withTimeout as withTimeoutAsync,
  timeout,
  TimeoutError as TimeoutErrorAsync,
  withFallback,
  fallback,
  hedge,
  compose as composeResilience,
  resilient,
  createHealthCheck,
} from './resilience';
export type {
  CircuitState,
  CircuitBreakerOptions,
  RetryOptions,
  RateLimiterOptions,
  BulkheadOptions,
  HealthCheckResult,
} from './resilience';

/* ==================== I18N UTILITIES ==================== */

export {
  getBrowserLocale,
  parseLocale,
  matchLocale,
  formatNumber as formatNumberI18n,
  formatCurrency as formatCurrencyI18n,
  formatPercent as formatPercentI18n,
  formatCompact,
  parseLocalizedNumber,
  formatDate as formatDateI18n,
  formatTime as formatTimeI18n,
  formatRelativeTime as formatRelativeTimeI18n,
  getDayNames,
  getMonthNames,
  getPluralCategory,
  pluralize as pluralizeI18n,
  createPluralizer,
  interpolate,
  interpolateFormatted,
  createTranslator,
  formatList,
  getLocaleName,
  getRegionName,
  getCurrencyName,
  isRTL,
  getTextDirection,
  createCollator,
  sortLocale,
  localeEquals,
  segmentWords,
  segmentSentences,
  segmentGraphemes,
  graphemeCount,
} from './i18n';
export type {
  LocaleCode,
  PluralCategory,
  PluralRules,
  PluralMessage,
  TranslationDictionary,
  I18nConfig,
} from './i18n';

export default utils;
