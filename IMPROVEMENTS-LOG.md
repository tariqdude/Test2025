# Improvements Log

## November 30, 2025

### Summary of Changes

#### 1. Security Hardening (XSS Prevention)

- **Refactored `Search.astro`**:
  - Replaced `innerHTML` usage with `document.createElement` and `textContent` to prevent XSS vulnerabilities.
  - Migrated `fuse.js` from CDN to a local npm dependency for better security and stability.
  - Added sanitization for search result rendering.
- **Refactored `PWARegistration.astro`**:
  - Removed `innerHTML` injection for update notifications.
  - Implemented a visibility toggle approach using pre-rendered HTML and CSS classes.
- **Refactored `error-dashboard.ts`**:
  - Replaced unsafe `innerHTML` assignments with DOM node creation and `textContent`.

#### 2. Code Quality & Type Safety

- **Updated `src/utils/function.ts`**:
  - Fixed TypeScript type definition for `debounce` timer to be environment-agnostic (using `ReturnType<typeof setTimeout>`).
- **Updated `src/utils/url.ts`**:
  - Fixed a bug in `buildUrl` where relative URLs caused an infinite loop/crash due to incorrect retry logic.
  - Implemented proper relative URL handling using a dummy base origin.
- **Updated `src/utils/string.ts`**:
  - Added `escapeHtml` utility function for safe HTML string manipulation.

#### 3. Utility Refactoring (Technical Debt)

- **Modularized Utilities**:
  - Split monolithic `helpers.ts` and `index.ts` into focused modules: `math.ts`, `storage.ts`, `color.ts`, `api.ts`, `date.ts`, `array.ts`, `string.ts`, `url.ts`, `validation.ts`, `function.ts`.
  - Created `src/utils/math.ts` for animation helpers (`easeInOut`, `lerp`, `clamp`).
  - Created `src/utils/storage.ts` for local storage operations with error handling.
  - Created `src/utils/color.ts` for color conversion (`hexToRgb`, `rgbToHex`).
  - Created `src/utils/api.ts` for `fetchWithTimeout` and API types.
- **Updated `src/utils/index.ts`**:
  - Refactored to re-export from the new modules instead of containing inline implementations.
- **Updated `src/utils/helpers.ts`**:
  - Converted to a deprecated barrel file that re-exports from the new modules, ensuring backward compatibility while resolving code duplication.
- **Updated `src/utils/url.ts`**:
  - Added `withBasePath` and `resolveHref` to centralize URL logic.

## December 01, 2025

### Summary of Changes

#### 1. Design System Migration (Cards)

- **Updated `ModernCard.astro`**:
  - Fixed `style` prop handling to correctly merge with internal styles (e.g., animation delays).
- **Refactored `visual-showcase.astro`**:
  - Replaced legacy HTML/CSS card implementations with `ModernCard` in multiple sections: "Functionality ideas", "Pairings & integrations", "Pipeline tracks", "Immersion timeline", "Material swatchboard", "Micro-Interactions", and "Interactive Demo".
- **Refactored `PerformanceMonitor.astro`**:
  - Replaced `vital-card`, `rum-card`, `server-metric`, and `optimization-item` divs with `ModernCard` (variant "minimal").
  - Cleaned up redundant CSS styles.
- **Refactored `SystemHighlights.astro`**:
  - Replaced `<article>` with `ModernCard` and removed legacy "technical" corner accents to align with the modern design system.
- **Verified `index.astro`**: Confirmed usage of `ModernCard` for Landing Pillars and Security Principles.

### Next Steps

- Continue migrating other legacy components to the new design system.
- Review `Advanced3DShowcase.astro` and other specialized 3D components for potential modernization where applicable (though they are currently kept as specialized implementations).

## November 23, 2025

### Summary of Changes

#### 1. Component Cleanup & Standardization

- **Deleted `HyperButton.astro`**: Removed this empty and unused component to reduce clutter.
- **Updated `HeroSection.astro`**: Refactored to use `ModernButton` instead of standard anchor tags, ensuring consistent design and behavior across the landing page.
- **Cleaned up `components.astro`**: Removed references to the deleted `HyperButton` component.

#### 2. Accessibility Improvements

- **Enhanced `ModernButton.astro`**:
  - Added `aria-busy` and `aria-disabled` attributes for better screen reader support during loading and disabled states.
  - Added `pointer-events-none` class to prevent interactions when disabled or loading.
  - Scoped the ripple effect script to `.modern-button` to avoid side effects on other elements.

#### 3. Blog Functionality

- **Implemented Pagination**: Renamed `src/pages/blog/index.astro` to `src/pages/blog/[...page].astro` and implemented `getStaticPaths` with `paginate`.
- **Updated Blog List**: Now displays posts in pages of 6, with "Previous" and "Next" navigation buttons.
- **UI Consistency**: Updated the blog list to use `ModernButton` for "Read Article" links.

### Next Steps

- Consider deprecating `Button.astro` in favor of `ModernButton.astro` completely.
- Add more comprehensive tests for the new pagination logic.
- Verify SEO tags on paginated pages (canonical URLs).
