/**
 * DOM manipulation utilities
 * Safe for both server and client environments
 */

/**
 * Check if running in browser environment
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Query selector with type safety
 */
export const $ = <T extends Element = Element>(
  selector: string,
  parent: Element | Document = document
): T | null => {
  if (!isBrowser()) return null;
  return parent.querySelector<T>(selector);
};

/**
 * Query selector all with type safety
 */
export const $$ = <T extends Element = Element>(
  selector: string,
  parent: Element | Document = document
): T[] => {
  if (!isBrowser()) return [];
  return Array.from(parent.querySelectorAll<T>(selector));
};

/**
 * Get element by ID with type safety
 */
export const byId = <T extends HTMLElement = HTMLElement>(
  id: string
): T | null => {
  if (!isBrowser()) return null;
  return document.getElementById(id) as T | null;
};

/**
 * Create element with attributes and children
 */
export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: {
    attributes?: Record<string, string>;
    classes?: string[];
    styles?: Partial<CSSStyleDeclaration>;
    children?: (Node | string)[];
    html?: string;
    text?: string;
  } = {}
): HTMLElementTagNameMap[K] => {
  if (!isBrowser()) {
    throw new Error('createElement can only be used in browser environment');
  }

  const element = document.createElement(tag);
  const { attributes, classes, styles, children, html, text } = options;

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (classes) {
    element.classList.add(...classes);
  }

  if (styles) {
    Object.assign(element.style, styles);
  }

  if (html) {
    element.innerHTML = html;
  } else if (text) {
    element.textContent = text;
  }

  if (children) {
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
  }

  return element;
};

/**
 * Add event listener with cleanup
 */
export const on = <K extends keyof HTMLElementEventMap>(
  element: Element | Window | Document | null,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): (() => void) => {
  if (!element) return () => {};

  element.addEventListener(event, handler as EventListener, options);

  return () => {
    element.removeEventListener(event, handler as EventListener, options);
  };
};

/**
 * Add one-time event listener
 */
export const once = <K extends keyof HTMLElementEventMap>(
  element: Element | Window | Document | null,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void
): (() => void) => {
  return on(element, event, handler, { once: true });
};

/**
 * Delegate event handling
 */
export const delegate = <K extends keyof HTMLElementEventMap>(
  parent: Element | Document | null,
  selector: string,
  event: K,
  handler: (e: HTMLElementEventMap[K], target: Element) => void
): (() => void) => {
  if (!parent) return () => {};

  const delegatedHandler = (e: Event) => {
    const target = (e.target as Element).closest(selector);
    if (target && parent.contains(target)) {
      handler(e as HTMLElementEventMap[K], target);
    }
  };

  parent.addEventListener(event, delegatedHandler);

  return () => {
    parent.removeEventListener(event, delegatedHandler);
  };
};

/**
 * Wait for DOM ready
 */
export const ready = (callback: () => void): void => {
  if (!isBrowser()) return;

  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  }
};

/**
 * Wait for window load
 */
export const loaded = (callback: () => void): void => {
  if (!isBrowser()) return;

  if (document.readyState === 'complete') {
    callback();
  } else {
    window.addEventListener('load', callback, { once: true });
  }
};

/**
 * Toggle class on element
 */
export const toggleClass = (
  element: Element | null,
  className: string,
  force?: boolean
): boolean => {
  if (!element) return false;
  return element.classList.toggle(className, force);
};

/**
 * Add multiple classes
 */
export const addClass = (
  element: Element | null,
  ...classNames: string[]
): void => {
  if (!element) return;
  element.classList.add(...classNames);
};

/**
 * Remove multiple classes
 */
export const removeClass = (
  element: Element | null,
  ...classNames: string[]
): void => {
  if (!element) return;
  element.classList.remove(...classNames);
};

/**
 * Check if element has class
 */
export const hasClass = (
  element: Element | null,
  className: string
): boolean => {
  if (!element) return false;
  return element.classList.contains(className);
};

/**
 * Set CSS custom property
 */
export const setCssVar = (
  name: string,
  value: string,
  element: HTMLElement = document.documentElement
): void => {
  if (!isBrowser()) return;
  element.style.setProperty(name.startsWith('--') ? name : `--${name}`, value);
};

/**
 * Get CSS custom property
 */
export const getCssVar = (
  name: string,
  element: HTMLElement = document.documentElement
): string => {
  if (!isBrowser()) return '';
  return getComputedStyle(element)
    .getPropertyValue(name.startsWith('--') ? name : `--${name}`)
    .trim();
};

/**
 * Get element's bounding rect
 */
export const getRect = (element: Element | null): DOMRect | null => {
  if (!element) return null;
  return element.getBoundingClientRect();
};

/**
 * Check if element is in viewport
 */
export const isInViewport = (
  element: Element | null,
  threshold = 0
): boolean => {
  if (!element || !isBrowser()) return false;

  const rect = element.getBoundingClientRect();

  return (
    rect.top >= -threshold &&
    rect.left >= -threshold &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) +
        threshold &&
    rect.right <=
      (window.innerWidth || document.documentElement.clientWidth) + threshold
  );
};

/**
 * Check if element is partially visible
 */
export const isPartiallyVisible = (element: Element | null): boolean => {
  if (!element || !isBrowser()) return false;

  const rect = element.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const verticallyVisible = rect.top < windowHeight && rect.bottom > 0;
  const horizontallyVisible = rect.left < windowWidth && rect.right > 0;

  return verticallyVisible && horizontallyVisible;
};

/**
 * Scroll element into view smoothly
 */
export const scrollIntoView = (
  element: Element | null,
  options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'center' }
): void => {
  if (!element) return;
  element.scrollIntoView(options);
};

/**
 * Scroll to top of page
 */
export const scrollToTop = (smooth = true): void => {
  if (!isBrowser()) return;
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto',
  });
};

/**
 * Get scroll position
 */
export const getScrollPosition = (): { x: number; y: number } => {
  if (!isBrowser()) return { x: 0, y: 0 };
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  };
};

/**
 * Lock body scroll
 */
export const lockScroll = (): (() => void) => {
  if (!isBrowser()) return () => {};

  const scrollY = window.scrollY;
  const body = document.body;

  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.width = '100%';
  body.style.overflowY = 'scroll';

  return () => {
    body.style.position = '';
    body.style.top = '';
    body.style.width = '';
    body.style.overflowY = '';
    window.scrollTo(0, scrollY);
  };
};

/**
 * Get element's offset from document
 */
export const getOffset = (
  element: Element | null
): { top: number; left: number } => {
  if (!element || !isBrowser()) return { top: 0, left: 0 };

  const rect = element.getBoundingClientRect();

  return {
    top: rect.top + window.pageYOffset - document.documentElement.clientTop,
    left: rect.left + window.pageXOffset - document.documentElement.clientLeft,
  };
};

/**
 * Get outer dimensions including margin
 */
export const getOuterDimensions = (
  element: Element | null
): { width: number; height: number } => {
  if (!element || !isBrowser()) return { width: 0, height: 0 };

  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return {
    width:
      rect.width + parseFloat(style.marginLeft) + parseFloat(style.marginRight),
    height:
      rect.height +
      parseFloat(style.marginTop) +
      parseFloat(style.marginBottom),
  };
};

/**
 * Insert element after another element
 */
export const insertAfter = (
  newElement: Element,
  referenceElement: Element
): void => {
  referenceElement.parentNode?.insertBefore(
    newElement,
    referenceElement.nextSibling
  );
};

/**
 * Remove element from DOM
 */
export const removeElement = (element: Element | null): void => {
  element?.remove();
};

/**
 * Replace element in DOM
 */
export const replaceElement = (
  oldElement: Element,
  newElement: Element
): void => {
  oldElement.replaceWith(newElement);
};

/**
 * Get all siblings of an element
 */
export const getSiblings = (element: Element | null): Element[] => {
  if (!element?.parentNode) return [];
  return Array.from(element.parentNode.children).filter(
    child => child !== element
  );
};

/**
 * Get next sibling matching selector
 */
export const getNextSibling = (
  element: Element | null,
  selector?: string
): Element | null => {
  if (!element) return null;

  let sibling = element.nextElementSibling;

  if (!selector) return sibling;

  while (sibling) {
    if (sibling.matches(selector)) return sibling;
    sibling = sibling.nextElementSibling;
  }

  return null;
};

/**
 * Get previous sibling matching selector
 */
export const getPrevSibling = (
  element: Element | null,
  selector?: string
): Element | null => {
  if (!element) return null;

  let sibling = element.previousElementSibling;

  if (!selector) return sibling;

  while (sibling) {
    if (sibling.matches(selector)) return sibling;
    sibling = sibling.previousElementSibling;
  }

  return null;
};

/**
 * Get all parent elements
 */
export const getParents = (
  element: Element | null,
  selector?: string
): Element[] => {
  const parents: Element[] = [];
  let parent = element?.parentElement;

  while (parent) {
    if (!selector || parent.matches(selector)) {
      parents.push(parent);
    }
    parent = parent.parentElement;
  }

  return parents;
};

/**
 * Wrap element with another element
 */
export const wrap = (element: Element, wrapper: Element): void => {
  element.parentNode?.insertBefore(wrapper, element);
  wrapper.appendChild(element);
};

/**
 * Unwrap element (remove parent wrapper)
 */
export const unwrap = (element: Element): void => {
  const parent = element.parentNode;
  if (!parent || parent === document.body) return;

  const grandparent = parent.parentNode;
  if (!grandparent) return;

  while (parent.firstChild) {
    grandparent.insertBefore(parent.firstChild, parent);
  }

  grandparent.removeChild(parent);
};

/**
 * Empty element (remove all children)
 */
export const empty = (element: Element | null): void => {
  if (!element) return;
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

/**
 * Clone element
 */
export const clone = <T extends Element>(element: T, deep = true): T => {
  return element.cloneNode(deep) as T;
};

/**
 * Get or set data attribute
 */
export const data = (
  element: HTMLElement | null,
  key: string,
  value?: string
): string | undefined => {
  if (!element) return undefined;

  if (value !== undefined) {
    element.dataset[key] = value;
    return value;
  }

  return element.dataset[key];
};

/**
 * Focus trap (for modals/dialogs)
 */
export const createFocusTrap = (
  container: Element
): { activate: () => void; deactivate: () => void } => {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];

  const getFocusableElements = () => {
    return $$(focusableSelectors.join(','), container) as HTMLElement[];
  };

  let previousActiveElement: Element | null = null;

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements();
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  return {
    activate: () => {
      previousActiveElement = document.activeElement;
      container.addEventListener('keydown', handleKeydown as EventListener);
      const focusable = getFocusableElements();
      focusable[0]?.focus();
    },
    deactivate: () => {
      container.removeEventListener('keydown', handleKeydown as EventListener);
      (previousActiveElement as HTMLElement)?.focus();
    },
  };
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!isBrowser()) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
};

/**
 * Read from clipboard
 */
export const readFromClipboard = async (): Promise<string | null> => {
  if (!isBrowser() || !navigator.clipboard?.readText) return null;

  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
};

/**
 * Observe element resize
 */
export const observeResize = (
  element: Element,
  callback: (entry: ResizeObserverEntry) => void
): (() => void) => {
  if (!isBrowser() || !('ResizeObserver' in window)) {
    return () => {};
  }

  const observer = new ResizeObserver(entries => {
    entries.forEach(callback);
  });

  observer.observe(element);

  return () => observer.disconnect();
};

/**
 * Observe element intersection
 */
export const observeIntersection = (
  element: Element,
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): (() => void) => {
  if (!isBrowser() || !('IntersectionObserver' in window)) {
    return () => {};
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(callback);
  }, options);

  observer.observe(element);

  return () => observer.disconnect();
};

/**
 * Observe DOM mutations
 */
export const observeMutations = (
  element: Element,
  callback: (mutations: MutationRecord[]) => void,
  options: MutationObserverInit = { childList: true, subtree: true }
): (() => void) => {
  if (!isBrowser() || !('MutationObserver' in window)) {
    return () => {};
  }

  const observer = new MutationObserver(callback);
  observer.observe(element, options);

  return () => observer.disconnect();
};

/**
 * Animate element
 */
export const animate = (
  element: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options?: number | KeyframeAnimationOptions
): Animation | null => {
  if (!isBrowser() || !element.animate) return null;
  return element.animate(keyframes, options);
};

/**
 * Fade in element
 */
export const fadeIn = (
  element: HTMLElement,
  duration = 300
): Animation | null => {
  element.style.display = '';
  return animate(element, [{ opacity: 0 }, { opacity: 1 }], {
    duration,
    fill: 'forwards',
  });
};

/**
 * Fade out element
 */
export const fadeOut = (
  element: HTMLElement,
  duration = 300
): Promise<void> => {
  return new Promise(resolve => {
    const animation = animate(element, [{ opacity: 1 }, { opacity: 0 }], {
      duration,
      fill: 'forwards',
    });

    if (animation) {
      animation.onfinish = () => {
        element.style.display = 'none';
        resolve();
      };
    } else {
      element.style.display = 'none';
      resolve();
    }
  });
};

/**
 * Print specific element
 */
export const printElement = (element: Element): void => {
  if (!isBrowser()) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Print</title>
        <style>
          body { margin: 0; padding: 20px; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.print();
  printWindow.close();
};
