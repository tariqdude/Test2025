# Utility Library Documentation

This project includes a comprehensive utility library that provides type-safe, tree-shakeable utilities for common web development tasks. All utilities are written in TypeScript and designed for modern browsers.

## Table of Contents

- [Events & Keyboard Shortcuts](#events--keyboard-shortcuts)
- [HTTP Client](#http-client)
- [Accessibility (a11y)](#accessibility-a11y)
- [Media & Device Detection](#media--device-detection)
- [Validation](#validation)
- [Crypto Utilities](#crypto-utilities)
- [State Management (Store)](#state-management-store)
- [Animation Utilities](#animation-utilities)

---

## Events & Keyboard Shortcuts

**Location:** `src/utils/events.ts`

### EventEmitter

A type-safe event emitter with subscription management:

```typescript
import { EventEmitter } from '../utils/events';

type MyEvents = {
  userLogin: { userId: string; timestamp: number };
  notification: { message: string };
};

const emitter = new EventEmitter<MyEvents>();

// Subscribe to events
const unsubscribe = emitter.on('userLogin', data => {
  console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});

// Emit events
emitter.emit('userLogin', { userId: '123', timestamp: Date.now() });

// One-time listener
emitter.once('notification', data => {
  console.log(data.message);
});

// Cleanup
unsubscribe();
```

### Keyboard Shortcuts

Register keyboard shortcuts with modifier key support:

```typescript
import { onKeyboardShortcut, registerShortcuts } from '../utils/events';

// Single shortcut
const cleanup = onKeyboardShortcut(
  { key: 'k', ctrl: true }, // Ctrl+K
  () => console.log('Command palette opened!')
);

// Multiple shortcuts at once
const cleanupAll = registerShortcuts([
  { shortcut: { key: 's', ctrl: true }, handler: () => save() },
  { shortcut: { key: 'z', ctrl: true, shift: true }, handler: () => redo() },
  { shortcut: { key: 'Escape' }, handler: () => closeModal() },
]);

// Cleanup when done
cleanupAll();
```

### Observable Values

Create reactive observable values:

```typescript
import { Observable } from '../utils/events';

const count = new Observable(0);

// Subscribe to changes
count.subscribe(value => {
  console.log('Count changed:', value);
});

// Update value
count.set(5);
count.update(prev => prev + 1);
```

### Other Event Utilities

```typescript
import {
  onMediaQueryChange,
  onVisibilityChange,
  onResize,
  onScroll,
  onIdle,
} from '../utils/events';

// React to dark mode changes
onMediaQueryChange('(prefers-color-scheme: dark)', isDark => {
  console.log('Dark mode:', isDark);
});

// Page visibility
onVisibilityChange(isVisible => {
  if (!isVisible) pauseVideo();
});

// Throttled resize handler
onResize(({ width, height }) => {
  console.log('Window size:', width, height);
}, 100);

// Throttled scroll handler
onScroll(({ x, y }) => {
  console.log('Scroll position:', x, y);
});

// Idle detection (user inactive for 60 seconds)
onIdle(() => {
  showIdleWarning();
}, 60000);
```

---

## HTTP Client

**Location:** `src/utils/http.ts`

A feature-rich, type-safe HTTP client wrapper:

```typescript
import { get, post, put, patch, del, createClient } from '../utils/http';

// Simple GET request
const response = await get<User>('/api/users/1');
console.log(response.data); // Typed as User

// POST with body
const newUser = await post<User>('/api/users', {
  name: 'John',
  email: 'john@example.com',
});

// With configuration
const result = await get<Product[]>('/api/products', {
  params: { category: 'electronics', limit: 10 },
  headers: { Authorization: 'Bearer token' },
  timeout: 5000,
});

// Create a reusable client with base configuration
const apiClient = createClient({
  baseURL: 'https://api.example.com',
  headers: { Authorization: 'Bearer token' },
  timeout: 10000,
});

const data = await apiClient.get<User[]>('/users');
```

### Advanced Features

```typescript
import {
  createInterceptorClient,
  uploadFile,
  downloadFile,
  poll,
} from '../utils/http';

// Client with request/response interceptors
const client = createInterceptorClient({
  baseURL: '/api',
  onRequest: config => {
    config.headers = {
      ...config.headers,
      'X-Request-ID': generateId(),
    };
    return config;
  },
  onResponse: response => {
    console.log('Response received:', response.status);
    return response;
  },
  onError: error => {
    if (error.status === 401) {
      redirectToLogin();
    }
    throw error;
  },
});

// File upload with progress
await uploadFile('/api/upload', file, {
  onProgress: progress => {
    console.log(`Uploaded: ${progress}%`);
  },
});

// File download
const blob = await downloadFile('/api/files/report.pdf');
const url = URL.createObjectURL(blob);

// Polling
const stopPolling = poll<Status>(
  '/api/status',
  data => {
    updateUI(data);
    return data.status === 'complete'; // Stop when complete
  },
  { interval: 2000, maxAttempts: 30 }
);
```

---

## Accessibility (a11y)

**Location:** `src/utils/a11y.ts`

Utilities for building accessible web applications:

### Screen Reader Announcements

```typescript
import { announce } from '../utils/a11y';

// Polite announcement (waits for idle)
announce('Your file has been saved.', 'polite');

// Assertive announcement (interrupts)
announce('Error: Form validation failed!', 'assertive');
```

### Focus Management

```typescript
import {
  createFocusTrap,
  getFocusableElements,
  createRovingTabIndex,
} from '../utils/a11y';

// Create focus trap for modal
const trap = createFocusTrap(modalElement, {
  initialFocus: firstInput,
  escapeDeactivates: true,
  onEscape: () => closeModal(),
});

trap.activate();
// When done:
trap.deactivate();

// Get all focusable elements in a container
const focusable = getFocusableElements(container);

// Roving tabindex for widget navigation (arrow keys)
const cleanup = createRovingTabIndex(listElement, {
  orientation: 'vertical',
  loop: true,
  onSelect: element => {
    element.click();
  },
});
```

### ARIA Helpers

```typescript
import { setAriaAttributes, generateId, skipLink } from '../utils/a11y';

// Set multiple ARIA attributes
setAriaAttributes(button, {
  expanded: true,
  controls: 'menu-id',
  haspopup: 'menu',
});

// Generate unique IDs for ARIA relationships
const id = generateId('modal'); // "modal-abc123"

// Create skip link
skipLink('Skip to main content', '#main');
```

### Color Contrast

```typescript
import { getContrastRatio, checkWcagCompliance } from '../utils/a11y';

const ratio = getContrastRatio('#000000', '#ffffff'); // 21

const compliance = checkWcagCompliance('#333333', '#ffffff');
// { AA: { normalText: true, largeText: true }, AAA: { normalText: true, largeText: true } }
```

---

## Media & Device Detection

**Location:** `src/utils/media.ts`

### Breakpoints

```typescript
import {
  breakpoints,
  getCurrentBreakpoint,
  watchBreakpoint,
  isBreakpoint,
} from '../utils/media';

// Get current breakpoint
const bp = getCurrentBreakpoint(); // 'sm', 'md', 'lg', 'xl', '2xl'

// Watch for breakpoint changes
const cleanup = watchBreakpoint(breakpoint => {
  console.log('Breakpoint changed to:', breakpoint);
});

// Check specific breakpoint
if (isBreakpoint('md')) {
  // Medium screens and up
}
```

### Device Detection

```typescript
import {
  getDeviceInfo,
  isMobile,
  isTablet,
  isDesktop,
  hasTouch,
  getNetworkInfo,
} from '../utils/media';

const device = getDeviceInfo();
// { isMobile, isTablet, isDesktop, isIOS, isAndroid, browser, os, isTouch }

if (isMobile()) {
  showMobileLayout();
}

if (hasTouch()) {
  enableTouchGestures();
}

const network = getNetworkInfo();
// { effectiveType, downlink, rtt, saveData }
```

### Viewport Utilities

```typescript
import {
  getViewportSize,
  getScrollPosition,
  isInViewport,
  toggleFullscreen,
} from '../utils/media';

const { width, height } = getViewportSize();
const { x, y } = getScrollPosition();

if (isInViewport(element)) {
  playAnimation();
}

// Fullscreen
await toggleFullscreen(videoElement);
```

---

## Validation

**Location:** `src/utils/validation.ts`

Zod-based validation schemas and utilities:

```typescript
import {
  emailSchema,
  phoneSchema,
  passwordSchema,
  urlSchema,
  uuidSchema,
  creditCardSchema,
} from '../utils/validation';

// Email validation
const emailResult = emailSchema.safeParse('user@example.com');
if (emailResult.success) {
  console.log('Valid email:', emailResult.data);
} else {
  console.error('Errors:', emailResult.error.issues);
}

// Password with strength requirements
const passwordResult = passwordSchema.safeParse('MyP@ssw0rd!');
// Requires: 8+ chars, uppercase, lowercase, number, special char

// URL validation
const urlResult = urlSchema.safeParse('https://example.com');

// Common validations
import {
  isNonEmptyString,
  isValidObject,
  validateRequiredFields,
  sanitizeInput,
} from '../utils/validation';

if (isNonEmptyString(input)) {
  // Safe to use
}

const sanitized = sanitizeInput(userInput); // XSS safe
```

---

## Crypto Utilities

**Location:** `src/utils/crypto.ts`

Web Crypto API utilities:

```typescript
import {
  uuid,
  shortId,
  nanoId,
  sha256,
  sha512,
  encrypt,
  decrypt,
  generatePassword,
  checkPasswordStrength,
} from '../utils/crypto';

// ID generation
const id = uuid(); // "550e8400-e29b-41d4-a716-446655440000"
const short = shortId(); // "abc123xy"
const nano = nanoId(); // "V1StGXR8_Z5jdHi6B-myT"

// Hashing
const hash = await sha256('Hello World');
// "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e"

// Encryption (AES-GCM)
const encrypted = await encrypt('secret data', 'password');
const decrypted = await decrypt(encrypted, 'password');

// Password utilities
const password = generatePassword({
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
});

const strength = checkPasswordStrength('MyP@ssw0rd');
// { score: 4, feedback: [], suggestions: [] }
```

---

## State Management (Store)

**Location:** `src/store/index.ts`

Nanostores-based reactive state management:

### Theme Management

```typescript
import { theme, setTheme, colorScheme } from '../store/index';

// Get current theme
const currentTheme = theme.get(); // 'ops-center', 'corporate', 'terminal'

// Set theme
setTheme('corporate');

// Subscribe to changes
theme.subscribe(value => {
  document.documentElement.dataset.theme = value;
});
```

### Notifications

```typescript
import { addNotification, dismissNotification, notify } from '../store/index';

// Quick notifications
notify.success('File saved successfully!');
notify.error('Failed to upload file');
notify.warning('Your session will expire soon');
notify.info('New features available');

// Custom notification
addNotification({
  type: 'success',
  title: 'Upload Complete',
  message: 'Your file has been uploaded successfully.',
  duration: 5000, // Auto-dismiss after 5s
  action: {
    label: 'View File',
    onClick: () => openFile(),
  },
});
```

### Form State

```typescript
import { createFormStore } from '../store/index';

const contactForm = createFormStore({
  name: '',
  email: '',
  message: '',
});

// Update fields
contactForm.fields.name.set('John');

// Get all values
const values = contactForm.getValues();

// Validate
const isValid = contactForm.isValid.get();

// Reset
contactForm.reset();
```

### Loading States

```typescript
import { loadingStates, setLoading, isLoading } from '../store/index';

setLoading('fetchUsers', true);

if (isLoading('fetchUsers')) {
  showSpinner();
}

setLoading('fetchUsers', false);
```

### Feature Flags

```typescript
import { featureFlags, setFeatureFlag, isFeatureEnabled } from '../store/index';

setFeatureFlag('newDashboard', true);

if (isFeatureEnabled('newDashboard')) {
  renderNewDashboard();
}
```

---

## Animation Utilities

**Location:** `src/scripts/animations.ts`

Pre-built animation effects:

```typescript
import {
  animateCounter,
  typewriterEffect,
  scrambleText,
  smoothScrollTo,
} from '../scripts/animations';

// Animate a number counter
animateCounter(element, { from: 0, to: 1000, duration: 2000 });

// Typewriter effect
typewriterEffect(element, 'Hello, World!', { speed: 50 });

// Text scramble effect
scrambleText(element, 'New Text', { duration: 1000 });

// Smooth scroll
smoothScrollTo('#section-id', { offset: -100 });
smoothScrollTo(element, { behavior: 'smooth' });
```

### CSS Animation Classes

The animation system also provides CSS classes for scroll-triggered animations:

```html
<!-- Fade in when scrolled into view -->
<div data-animate="fade-in">Content</div>

<!-- Slide up -->
<div data-animate="slide-up" data-delay="200">Content</div>

<!-- Available animations: fade-in, slide-up, slide-down, slide-left, slide-right, scale, blur -->
```

---

## Usage Tips

1. **Tree Shaking**: Import only what you need to minimize bundle size:

   ```typescript
   // Good - tree-shakeable
   import { uuid } from '../utils/crypto';

   // Avoid - imports everything
   import * as crypto from '../utils/crypto';
   ```

2. **TypeScript**: All utilities are fully typed. Use your IDE's autocomplete!

3. **SSR Safe**: All utilities check for browser environment before accessing window/document.

4. **Cleanup**: Most event-based utilities return cleanup functions. Use them!

   ```typescript
   const cleanup = onResize(() => {});
   // When component unmounts:
   cleanup();
   ```

5. **Demo Page**: Visit `/utility-demo` to see interactive examples of all utilities.
