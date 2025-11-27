# Technical Debt: Utility Function Consolidation

## Overview

This document tracks known technical debt related to duplicate utility functions across the codebase. These are areas that work correctly but could be improved for maintainability.

## Duplicate Utilities

### 1. Date Formatting Functions

**Files Affected:**

- `src/utils/helpers.ts` - `formatDate`, `getRelativeTime`
- `src/utils/index.ts` - `formatDate`, `formatRelativeTime`

**Description:**
Both files contain similar date formatting implementations. The `index.ts` version uses `Intl.RelativeTimeFormat` while `helpers.ts` uses a manual approach.

**Recommendation:**
Consolidate into a single `src/utils/date.ts` module and re-export from both locations for backward compatibility.

### 2. Array Utilities

**Files Affected:**

- `src/utils/helpers.ts` - `groupBy`, `sortBy`, `unique`, `chunk`
- `src/utils/index.ts` - `groupBy`, `unique`, `chunk`, `shuffle`

**Description:**
Duplicate implementations of common array utilities. The `index.ts` versions are slightly more type-safe.

**Recommendation:**
Keep the more type-safe versions in `index.ts` and remove duplicates from `helpers.ts`.

### 3. String Utilities

**Files Affected:**

- `src/utils/helpers.ts` - `truncateText`, `capitalizeFirst`, `capitalizeWords`
- `src/utils/index.ts` - `truncate`, `titleCase`, `getInitials`

**Description:**
Similar string manipulation utilities with slightly different behaviors (e.g., `truncateText` vs `truncate` with word boundary respect).

**Recommendation:**
Keep both if behaviors differ meaningfully, otherwise consolidate and document the chosen behavior.

### 4. Debounce/Throttle

**Files Affected:**

- `src/utils/helpers.ts` - `debounce`, `throttle`
- `src/utils/index.ts` - `debounce`, `throttle`

**Description:**
Identical implementations in both files.

**Priority:** HIGH - These are exact duplicates.

**Recommendation:**
Remove from one file and export from a single location.

### 5. URL Utilities

**Files Affected:**

- `src/utils/helpers.ts` - `buildUrl`, `withBasePath`, `resolveHref`
- `src/utils/index.ts` - `buildUrl`, `parseQuery`

**Description:**
`buildUrl` exists in both files with slightly different signatures.

**Recommendation:**
Consolidate and use a single signature that covers all use cases.

### 6. Validation Functions

**Files Affected:**

- `src/utils/helpers.ts` - `validateEmail`, `validatePhone`
- `src/utils/index.ts` - `isValidEmail`
- `src/utils/validation.ts` - Comprehensive Zod schemas

**Description:**
Multiple validation approaches exist. `validation.ts` is the most comprehensive.

**Priority:** MEDIUM

**Recommendation:**
Use `validation.ts` as the single source of truth. Update helpers to re-export or use the Zod schemas.

## Proposed Consolidation Plan

### Phase 1: Non-Breaking Changes

1. Create `src/utils/deprecated.ts` with deprecation notices
2. Add JSDoc `@deprecated` tags to duplicate functions
3. Update internal code to use preferred implementations

### Phase 2: Consolidation

1. Create focused utility modules:
   - `src/utils/date.ts`
   - `src/utils/array.ts`
   - `src/utils/string.ts`
   - `src/utils/function.ts` (debounce, throttle, etc.)
2. Update `helpers.ts` and `index.ts` to re-export from these modules

### Phase 3: Cleanup

1. Remove deprecated re-exports after a release cycle
2. Update documentation
3. Add linting rules to prevent future duplication

## Impact Assessment

| Area              | Duplicate Count | Effort | Priority |
| ----------------- | --------------- | ------ | -------- |
| Debounce/Throttle | 2               | Low    | High     |
| Date Functions    | 2               | Medium | Medium   |
| Array Utilities   | 4               | Medium | Medium   |
| String Utilities  | 3               | Low    | Low      |
| URL Utilities     | 2               | Low    | Medium   |
| Validation        | 3               | High   | Medium   |

## Notes

- All duplicates currently work correctly
- No bugs have been reported due to these duplicates
- The main concern is maintainability and confusion for developers
- Consider this during the next major refactoring sprint

---

_Last Updated: 2025_
_Status: Tracking_
