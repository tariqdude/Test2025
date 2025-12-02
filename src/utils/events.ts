/**
 * Event Emitter and Pub/Sub Utilities
 * Type-safe event handling for browser and server environments
 */

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

/**
 * Event subscription options
 */
export interface SubscriptionOptions {
  /** Call handler only once, then unsubscribe */
  once?: boolean;
  /** Priority level (higher = called first) */
  priority?: number;
  /** Debounce delay in ms */
  debounce?: number;
  /** Throttle limit in ms */
  throttle?: number;
}

/**
 * Subscription cleanup function
 */
export type Unsubscribe = () => void;

/**
 * Type-safe event emitter
 */
export class EventEmitter<
  TEvents extends Record<string, unknown> = Record<string, unknown>,
> {
  private handlers: Map<
    keyof TEvents,
    Set<{
      handler: EventHandler<unknown>;
      options: SubscriptionOptions;
      wrappedHandler?: EventHandler<unknown>;
    }>
  > = new Map();

  private onceHandlers: Set<EventHandler<unknown>> = new Set();

  /**
   * Subscribe to an event
   */
  on<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
    options: SubscriptionOptions = {}
  ): Unsubscribe {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }

    let wrappedHandler: EventHandler<TEvents[K]> = handler;

    // Apply debounce
    if (options.debounce && options.debounce > 0) {
      let timeout: ReturnType<typeof setTimeout>;
      const originalHandler = wrappedHandler;
      wrappedHandler = (data: TEvents[K]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => originalHandler(data), options.debounce);
      };
    }

    // Apply throttle
    if (options.throttle && options.throttle > 0) {
      let lastCall = 0;
      const originalHandler = wrappedHandler;
      wrappedHandler = (data: TEvents[K]) => {
        const now = Date.now();
        if (now - lastCall >= options.throttle!) {
          lastCall = now;
          originalHandler(data);
        }
      };
    }

    // Handle once option
    if (options.once) {
      const originalHandler = wrappedHandler;
      wrappedHandler = (data: TEvents[K]) => {
        this.off(event, handler);
        originalHandler(data);
      };
      this.onceHandlers.add(handler as EventHandler<unknown>);
    }

    const entry = {
      handler: handler as EventHandler<unknown>,
      options,
      wrappedHandler: wrappedHandler as EventHandler<unknown>,
    };

    this.handlers.get(event)!.add(entry);

    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event (alias for on)
   */
  subscribe<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
    options?: SubscriptionOptions
  ): Unsubscribe {
    return this.on(event, handler, options);
  }

  /**
   * Subscribe to an event, auto-unsubscribe after first call
   */
  once<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): Unsubscribe {
    return this.on(event, handler, { once: true });
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    for (const entry of handlers) {
      if (entry.handler === handler) {
        handlers.delete(entry);
        this.onceHandlers.delete(handler as EventHandler<unknown>);
        break;
      }
    }
  }

  /**
   * Emit an event with data
   */
  emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    // Sort by priority (higher first)
    const sortedHandlers = [...handlers].sort(
      (a, b) => (b.options.priority ?? 0) - (a.options.priority ?? 0)
    );

    for (const entry of sortedHandlers) {
      try {
        const fn = entry.wrappedHandler ?? entry.handler;
        fn(data);
      } catch (error) {
        console.error(`Error in event handler for "${String(event)}":`, error);
      }
    }
  }

  /**
   * Emit an event and wait for all async handlers
   */
  async emitAsync<K extends keyof TEvents>(
    event: K,
    data: TEvents[K]
  ): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    const sortedHandlers = [...handlers].sort(
      (a, b) => (b.options.priority ?? 0) - (a.options.priority ?? 0)
    );

    await Promise.all(
      sortedHandlers.map(async entry => {
        try {
          const fn = entry.wrappedHandler ?? entry.handler;
          await fn(data);
        } catch (error) {
          console.error(
            `Error in async event handler for "${String(event)}":`,
            error
          );
        }
      })
    );
  }

  /**
   * Get count of handlers for an event
   */
  listenerCount<K extends keyof TEvents>(event: K): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  /**
   * Check if event has any handlers
   */
  hasListeners<K extends keyof TEvents>(event: K): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * Remove all handlers for an event
   */
  removeAllListeners<K extends keyof TEvents>(event?: K): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
      this.onceHandlers.clear();
    }
  }

  /**
   * Get all registered event names
   */
  eventNames(): (keyof TEvents)[] {
    return [...this.handlers.keys()];
  }

  /**
   * Create a promise that resolves on next event emission
   */
  waitFor<K extends keyof TEvents>(
    event: K,
    timeout?: number
  ): Promise<TEvents[K]> {
    return new Promise((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout>;

      const unsubscribe = this.once(event, data => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(data);
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          unsubscribe();
          reject(new Error(`Timeout waiting for event: ${String(event)}`));
        }, timeout);
      }
    });
  }
}

/**
 * Global event bus for application-wide events
 */
export const eventBus = new EventEmitter();

/**
 * Create a namespaced event emitter
 */
export function createNamespacedEmitter<
  TEvents extends Record<string, unknown>,
>(namespace: string): EventEmitter<TEvents> & { namespace: string } {
  const emitter = new EventEmitter<TEvents>();
  return Object.assign(emitter, { namespace });
}

/**
 * Browser custom events wrapper
 */
export const customEvents = {
  /**
   * Dispatch a custom event on an element
   */
  dispatch: <T = unknown>(
    element: EventTarget,
    eventName: string,
    detail?: T,
    options?: CustomEventInit
  ): boolean => {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    return element.dispatchEvent(event);
  },

  /**
   * Listen for a custom event on an element
   */
  listen: <T = unknown>(
    element: EventTarget,
    eventName: string,
    handler: (detail: T, event: CustomEvent<T>) => void,
    options?: AddEventListenerOptions
  ): Unsubscribe => {
    const wrappedHandler = (e: Event) => {
      const customEvent = e as CustomEvent<T>;
      handler(customEvent.detail, customEvent);
    };

    element.addEventListener(eventName, wrappedHandler, options);
    return () =>
      element.removeEventListener(eventName, wrappedHandler, options);
  },

  /**
   * Dispatch on document
   */
  broadcast: <T = unknown>(eventName: string, detail?: T): boolean => {
    if (typeof document === 'undefined') return false;
    return customEvents.dispatch(document, eventName, detail);
  },

  /**
   * Listen on document
   */
  onBroadcast: <T = unknown>(
    eventName: string,
    handler: (detail: T, event: CustomEvent<T>) => void,
    options?: AddEventListenerOptions
  ): Unsubscribe => {
    if (typeof document === 'undefined') return () => {};
    return customEvents.listen(document, eventName, handler, options);
  },
};

/**
 * Observable value with change notifications
 */
export class Observable<T> {
  private value: T;
  private emitter = new EventEmitter<{ change: { value: T; previous: T } }>();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  get(): T {
    return this.value;
  }

  set(newValue: T): void {
    const previous = this.value;
    if (previous !== newValue) {
      this.value = newValue;
      this.emitter.emit('change', { value: newValue, previous });
    }
  }

  update(updater: (current: T) => T): void {
    this.set(updater(this.value));
  }

  subscribe(handler: (data: { value: T; previous: T }) => void): Unsubscribe {
    return this.emitter.on('change', handler);
  }

  /**
   * Create a derived observable
   */
  derive<U>(transform: (value: T) => U): Observable<U> {
    const derived = new Observable(transform(this.value));
    this.subscribe(({ value }) => derived.set(transform(value)));
    return derived;
  }
}

/**
 * Create an observable value
 */
export function observable<T>(initialValue: T): Observable<T> {
  return new Observable(initialValue);
}

/**
 * Combine multiple observables
 */
export function combineObservables<T extends Observable<unknown>[]>(
  observables: [...T]
): Observable<{
  [K in keyof T]: T[K] extends Observable<infer U> ? U : never;
}> {
  type CombinedValue = {
    [K in keyof T]: T[K] extends Observable<infer U> ? U : never;
  };

  const getValues = (): CombinedValue =>
    observables.map(obs => obs.get()) as CombinedValue;

  const combined = new Observable<CombinedValue>(getValues());

  observables.forEach(obs => {
    obs.subscribe(() => combined.set(getValues()));
  });

  return combined;
}

/**
 * Event delegation helper
 */
export function delegateEvent<K extends keyof HTMLElementEventMap>(
  container: Element | Document,
  eventType: K,
  selector: string,
  handler: (event: HTMLElementEventMap[K], target: Element) => void,
  options?: AddEventListenerOptions
): Unsubscribe {
  const delegatedHandler = (e: Event) => {
    const target = (e.target as Element)?.closest(selector);
    if (target && container.contains(target)) {
      handler(e as HTMLElementEventMap[K], target);
    }
  };

  container.addEventListener(eventType, delegatedHandler, options);
  return () =>
    container.removeEventListener(eventType, delegatedHandler, options);
}

/**
 * Keyboard shortcut handler
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export function onKeyboardShortcut(
  shortcut: KeyboardShortcut,
  handler: (event: KeyboardEvent) => void,
  target: EventTarget = typeof document !== 'undefined'
    ? document
    : ({} as EventTarget)
): Unsubscribe {
  const listener = (e: Event) => {
    const event = e as KeyboardEvent;
    const matches =
      event.key.toLowerCase() === shortcut.key.toLowerCase() &&
      !!event.ctrlKey === !!shortcut.ctrl &&
      !!event.altKey === !!shortcut.alt &&
      !!event.shiftKey === !!shortcut.shift &&
      !!event.metaKey === !!shortcut.meta;

    if (matches) {
      event.preventDefault();
      handler(event);
    }
  };

  target.addEventListener('keydown', listener);
  return () => target.removeEventListener('keydown', listener);
}

/**
 * Create keyboard shortcuts from string notation
 * Example: "Ctrl+Shift+K" or "Meta+Enter"
 */
export function parseShortcut(shortcutString: string): KeyboardShortcut {
  const parts = shortcutString.toLowerCase().split('+');
  const key = parts.pop() || '';

  return {
    key,
    ctrl: parts.includes('ctrl'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd'),
  };
}

/**
 * Register multiple keyboard shortcuts
 */
export function registerShortcuts(
  shortcuts: Record<string, (event: KeyboardEvent) => void>,
  target?: EventTarget
): Unsubscribe {
  const unsubscribers = Object.entries(shortcuts).map(
    ([shortcutString, handler]) =>
      onKeyboardShortcut(parseShortcut(shortcutString), handler, target)
  );

  return () => unsubscribers.forEach(unsub => unsub());
}

/**
 * Media query change listener
 */
export function onMediaQueryChange(
  query: string,
  handler: (matches: boolean) => void,
  immediate = true
): Unsubscribe {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia(query);

  const listener = (e: MediaQueryListEvent | MediaQueryList) => {
    handler(e.matches);
  };

  if (immediate) {
    handler(mediaQuery.matches);
  }

  // Use modern API (legacy addListener/removeListener are deprecated)
  mediaQuery.addEventListener('change', listener);
  return () => mediaQuery.removeEventListener('change', listener);
}

/**
 * Visibility change listener
 */
export function onVisibilityChange(
  handler: (isVisible: boolean) => void
): Unsubscribe {
  if (typeof document === 'undefined') return () => {};

  const listener = () => {
    handler(!document.hidden);
  };

  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
}

/**
 * Online/offline status listener
 */
export function onOnlineStatusChange(
  handler: (isOnline: boolean) => void,
  immediate = true
): Unsubscribe {
  if (typeof window === 'undefined') return () => {};

  if (immediate) {
    handler(navigator.onLine);
  }

  const onOnline = () => handler(true);
  const onOffline = () => handler(false);

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Window resize listener with debounce
 */
export function onResize(
  handler: (size: { width: number; height: number }) => void,
  debounceMs = 100
): Unsubscribe {
  if (typeof window === 'undefined') return () => {};

  let timeout: ReturnType<typeof setTimeout>;

  const listener = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      handler({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, debounceMs);
  };

  window.addEventListener('resize', listener);
  return () => {
    clearTimeout(timeout);
    window.removeEventListener('resize', listener);
  };
}

/**
 * Scroll listener with throttle
 */
export function onScroll(
  handler: (position: { x: number; y: number }) => void,
  throttleMs = 16,
  target: EventTarget = typeof window !== 'undefined'
    ? window
    : ({} as EventTarget)
): Unsubscribe {
  let lastCall = 0;

  const listener = () => {
    const now = Date.now();
    if (now - lastCall >= throttleMs) {
      lastCall = now;
      handler({
        x: typeof window !== 'undefined' ? window.scrollX : 0,
        y: typeof window !== 'undefined' ? window.scrollY : 0,
      });
    }
  };

  target.addEventListener('scroll', listener, { passive: true });
  return () => target.removeEventListener('scroll', listener);
}

/**
 * Idle detection (no user activity)
 */
export function onIdle(
  handler: () => void,
  idleTime = 60000,
  events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
): Unsubscribe {
  if (typeof window === 'undefined') return () => {};

  let timeout: ReturnType<typeof setTimeout>;

  const resetTimer = () => {
    clearTimeout(timeout);
    timeout = setTimeout(handler, idleTime);
  };

  events.forEach(event => {
    document.addEventListener(event, resetTimer, { passive: true });
  });

  resetTimer();

  return () => {
    clearTimeout(timeout);
    events.forEach(event => {
      document.removeEventListener(event, resetTimer);
    });
  };
}
