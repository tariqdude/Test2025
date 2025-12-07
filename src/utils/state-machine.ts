/**
 * State Machine Utilities
 * @module utils/state-machine
 * @description Finite state machine implementation with support for
 * transitions, guards, actions, and event-driven state management.
 */

/**
 * State configuration
 */
export interface StateConfig<
  TContext = unknown,
  TEvent extends { type: string } = { type: string },
> {
  /** Action to run on entering this state */
  onEnter?: (context: TContext, event?: TEvent) => void | TContext;
  /** Action to run on exiting this state */
  onExit?: (context: TContext, event?: TEvent) => void | TContext;
  /** Allowed transitions from this state */
  on?: Record<string, StateTransition<TContext, TEvent> | string>;
}

/**
 * State transition configuration
 */
export interface StateTransition<
  TContext = unknown,
  TEvent extends { type: string } = { type: string },
> {
  /** Target state */
  target: string;
  /** Guard condition - transition only if returns true */
  guard?: (context: TContext, event: TEvent) => boolean;
  /** Action to run during transition */
  action?: (context: TContext, event: TEvent) => void | TContext;
}

/**
 * State machine configuration
 */
export interface StateMachineConfig<
  TContext = unknown,
  TEvent extends { type: string } = { type: string },
> {
  /** Initial state */
  initial: string;
  /** Initial context */
  context?: TContext;
  /** State definitions */
  states: Record<string, StateConfig<TContext, TEvent>>;
  /** Global event handlers */
  on?: Record<string, StateTransition<TContext, TEvent> | string>;
}

/**
 * State machine instance
 */
export interface StateMachine<
  TContext = unknown,
  TEvent extends { type: string } = { type: string },
> {
  /** Current state */
  readonly state: string;
  /** Current context */
  readonly context: TContext;
  /** State history */
  readonly history: string[];
  /** Check if can transition on event */
  can(eventType: string): boolean;
  /** Send event to trigger transition */
  send(event: TEvent | string): void;
  /** Check if in specific state */
  matches(state: string): boolean;
  /** Subscribe to state changes */
  subscribe(
    listener: (state: string, context: TContext, event?: TEvent) => void
  ): () => void;
  /** Get available transitions */
  getTransitions(): string[];
  /** Reset to initial state */
  reset(): void;
}

/**
 * Create a finite state machine
 * @param config - State machine configuration
 * @returns State machine instance
 * @example
 * const trafficLight = createStateMachine({
 *   initial: 'green',
 *   states: {
 *     green: { on: { TIMER: 'yellow' } },
 *     yellow: { on: { TIMER: 'red' } },
 *     red: { on: { TIMER: 'green' } },
 *   },
 * });
 *
 * trafficLight.send('TIMER'); // green -> yellow
 */
export function createStateMachine<
  TContext = undefined,
  TEvent extends { type: string } = { type: string },
>(
  config: StateMachineConfig<TContext, TEvent>
): StateMachine<TContext, TEvent> {
  let currentState = config.initial;
  let context = (config.context ?? {}) as TContext;
  const history: string[] = [config.initial];
  const listeners = new Set<
    (state: string, context: TContext, event?: TEvent) => void
  >();

  const getTransitionConfig = (
    eventType: string
  ): StateTransition<TContext, TEvent> | null => {
    const stateConfig = config.states[currentState];

    // Check state-level transitions first
    if (stateConfig?.on?.[eventType]) {
      const transition = stateConfig.on[eventType];
      if (typeof transition === 'string') {
        return { target: transition };
      }
      return transition;
    }

    // Check global transitions
    if (config.on?.[eventType]) {
      const transition = config.on[eventType];
      if (typeof transition === 'string') {
        return { target: transition };
      }
      return transition;
    }

    return null;
  };

  const notifyListeners = (event?: TEvent): void => {
    for (const listener of listeners) {
      listener(currentState, context, event);
    }
  };

  const transition = (targetState: string, event: TEvent): void => {
    const fromState = currentState;
    const fromConfig = config.states[fromState];
    const toConfig = config.states[targetState];

    if (!toConfig) {
      console.warn(`State "${targetState}" is not defined`);
      return;
    }

    // Run exit action
    if (fromConfig?.onExit) {
      const newContext = fromConfig.onExit(context, event);
      if (newContext !== undefined) {
        context = newContext;
      }
    }

    // Update state
    currentState = targetState;
    history.push(targetState);

    // Run enter action
    if (toConfig.onEnter) {
      const newContext = toConfig.onEnter(context, event);
      if (newContext !== undefined) {
        context = newContext;
      }
    }

    notifyListeners(event);
  };

  return {
    get state() {
      return currentState;
    },

    get context() {
      return context;
    },

    get history() {
      return [...history];
    },

    can(eventType: string): boolean {
      const transitionConfig = getTransitionConfig(eventType);
      if (!transitionConfig) return false;

      // Check guard if present
      if (transitionConfig.guard) {
        return transitionConfig.guard(context, { type: eventType } as TEvent);
      }

      return true;
    },

    send(event: TEvent | string): void {
      const eventObj =
        typeof event === 'string' ? ({ type: event } as TEvent) : event;
      const transitionConfig = getTransitionConfig(eventObj.type);

      if (!transitionConfig) {
        console.warn(
          `No transition for event "${eventObj.type}" in state "${currentState}"`
        );
        return;
      }

      // Check guard
      if (
        transitionConfig.guard &&
        !transitionConfig.guard(context, eventObj)
      ) {
        return;
      }

      // Run transition action
      if (transitionConfig.action) {
        const newContext = transitionConfig.action(context, eventObj);
        if (newContext !== undefined) {
          context = newContext;
        }
      }

      // Perform transition
      transition(transitionConfig.target, eventObj);
    },

    matches(state: string): boolean {
      return currentState === state;
    },

    subscribe(
      listener: (state: string, context: TContext, event?: TEvent) => void
    ): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getTransitions(): string[] {
      const stateConfig = config.states[currentState];
      const transitions = new Set<string>();

      if (stateConfig?.on) {
        Object.keys(stateConfig.on).forEach(t => transitions.add(t));
      }
      if (config.on) {
        Object.keys(config.on).forEach(t => transitions.add(t));
      }

      return Array.from(transitions);
    },

    reset(): void {
      currentState = config.initial;
      context = (config.context ?? {}) as TContext;
      history.length = 0;
      history.push(config.initial);
      notifyListeners();
    },
  };
}

// ============================================================================
// Reducer Pattern
// ============================================================================

/**
 * Action with type and optional payload
 */
export interface Action<T = string, P = unknown> {
  type: T;
  payload?: P;
}

/**
 * Reducer function
 */
export type Reducer<S, A extends Action = Action> = (state: S, action: A) => S;

/**
 * Action creator
 */
export type ActionCreator<T = string, P = unknown> = (
  payload?: P
) => Action<T, P>;

/**
 * Create a reducer with initial state
 */
export function createReducer<S, A extends Action = Action>(
  initialState: S,
  handlers: Record<string, (state: S, action: A) => S>
): { reducer: Reducer<S, A>; initialState: S } {
  const reducer: Reducer<S, A> = (state = initialState, action) => {
    const handler = handlers[action.type];
    if (handler) {
      return handler(state, action);
    }
    return state;
  };

  return { reducer, initialState };
}

/**
 * Create an action creator
 */
export function createAction<T extends string, P = void>(
  type: T
): P extends void ? () => Action<T, undefined> : (payload: P) => Action<T, P> {
  return ((payload?: P) => ({ type, payload })) as P extends void
    ? () => Action<T, undefined>
    : (payload: P) => Action<T, P>;
}

/**
 * Combine multiple reducers
 */
export function combineReducers<S extends Record<string, unknown>>(reducers: {
  [K in keyof S]: Reducer<S[K]>;
}): Reducer<S> {
  return (state: S, action: Action): S => {
    const nextState: Partial<S> = {};
    let hasChanged = false;

    for (const key in reducers) {
      const reducer = reducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);

      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    return hasChanged ? (nextState as S) : state;
  };
}

// ============================================================================
// Simple Store
// ============================================================================

/**
 * Store instance
 */
export interface Store<S, A extends Action = Action> {
  /** Get current state */
  getState(): S;
  /** Dispatch an action */
  dispatch(action: A): void;
  /** Subscribe to state changes */
  subscribe(listener: (state: S) => void): () => void;
  /** Replace reducer */
  replaceReducer(nextReducer: Reducer<S, A>): void;
}

/**
 * Store enhancer
 */
export type StoreEnhancer<S, A extends Action = Action> = (
  createStore: (reducer: Reducer<S, A>, initialState: S) => Store<S, A>
) => (reducer: Reducer<S, A>, initialState: S) => Store<S, A>;

/**
 * Create a simple store
 * @param reducer - Reducer function
 * @param initialState - Initial state
 * @returns Store instance
 * @example
 * const store = createStore(counterReducer, { count: 0 });
 * store.subscribe(state => console.log(state));
 * store.dispatch({ type: 'INCREMENT' });
 */
export function createStore<S, A extends Action = Action>(
  reducer: Reducer<S, A>,
  initialState: S,
  enhancer?: StoreEnhancer<S, A>
): Store<S, A> {
  if (enhancer) {
    return enhancer(createStore)(reducer, initialState);
  }

  let state = initialState;
  let currentReducer = reducer;
  const listeners = new Set<(state: S) => void>();

  return {
    getState(): S {
      return state;
    },

    dispatch(action: A): void {
      state = currentReducer(state, action);
      for (const listener of listeners) {
        listener(state);
      }
    },

    subscribe(listener: (state: S) => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    replaceReducer(nextReducer: Reducer<S, A>): void {
      currentReducer = nextReducer;
    },
  };
}

/**
 * Create a store with middleware support
 */
export type Middleware<S, A extends Action = Action> = (store: {
  getState: () => S;
  dispatch: (action: A) => void;
}) => (next: (action: A) => void) => (action: A) => void;

export function applyMiddleware<S, A extends Action = Action>(
  ...middlewares: Middleware<S, A>[]
): StoreEnhancer<S, A> {
  return createStoreFunc => (reducer, initialState) => {
    const store = createStoreFunc(reducer, initialState);
    let dispatch = store.dispatch;

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action: A) => dispatch(action),
    };

    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    dispatch = chain.reduceRight(
      (next, middleware) => middleware(next),
      store.dispatch
    );

    return {
      ...store,
      dispatch,
    };
  };
}

/**
 * Logger middleware
 */
export function loggerMiddleware<S, A extends Action = Action>(): Middleware<
  S,
  A
> {
  return store => next => action => {
    console.group(action.type);
    console.log('Previous State:', store.getState());
    console.log('Action:', action);
    next(action);
    console.log('Next State:', store.getState());
    console.groupEnd();
  };
}

/**
 * Thunk middleware for async actions
 */
export type ThunkAction<S, A extends Action = Action> = (
  dispatch: (action: A | ThunkAction<S, A>) => void,
  getState: () => S
) => void | Promise<void>;

export function thunkMiddleware<S, A extends Action = Action>(): Middleware<
  S,
  A
> {
  return store => next => (action: A | ThunkAction<S, A>) => {
    if (typeof action === 'function') {
      return (action as ThunkAction<S, A>)(
        store.dispatch as (action: A | ThunkAction<S, A>) => void,
        store.getState
      );
    }
    return next(action as A);
  };
}

// ============================================================================
// Pub/Sub
// ============================================================================

/**
 * Pub/Sub instance
 */
export interface PubSub<
  TEvents extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Publish event */
  publish<K extends keyof TEvents>(event: K, data: TEvents[K]): void;
  /** Subscribe to event */
  subscribe<K extends keyof TEvents>(
    event: K,
    handler: (data: TEvents[K]) => void
  ): () => void;
  /** Subscribe once */
  subscribeOnce<K extends keyof TEvents>(
    event: K,
    handler: (data: TEvents[K]) => void
  ): () => void;
  /** Unsubscribe all handlers for an event */
  clear(event?: keyof TEvents): void;
  /** Check if has subscribers */
  hasSubscribers(event: keyof TEvents): boolean;
}

/**
 * Create a pub/sub event system
 * @returns Pub/Sub instance
 * @example
 * const events = createPubSub<{ userLogin: { userId: string }; userLogout: {} }>();
 * events.subscribe('userLogin', (data) => console.log(data.userId));
 * events.publish('userLogin', { userId: '123' });
 */
export function createPubSub<
  TEvents extends Record<string, unknown> = Record<string, unknown>,
>(): PubSub<TEvents> {
  const subscribers = new Map<keyof TEvents, Set<(data: unknown) => void>>();

  return {
    publish<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
      const handlers = subscribers.get(event);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(data);
          } catch (error) {
            console.error(
              `Error in event handler for "${String(event)}":`,
              error
            );
          }
        }
      }
    },

    subscribe<K extends keyof TEvents>(
      event: K,
      handler: (data: TEvents[K]) => void
    ): () => void {
      if (!subscribers.has(event)) {
        subscribers.set(event, new Set());
      }
      subscribers.get(event)!.add(handler as (data: unknown) => void);

      return () => {
        subscribers.get(event)?.delete(handler as (data: unknown) => void);
      };
    },

    subscribeOnce<K extends keyof TEvents>(
      event: K,
      handler: (data: TEvents[K]) => void
    ): () => void {
      const unsubscribe = this.subscribe(event, (data: TEvents[K]) => {
        unsubscribe();
        handler(data);
      });
      return unsubscribe;
    },

    clear(event?: keyof TEvents): void {
      if (event) {
        subscribers.delete(event);
      } else {
        subscribers.clear();
      }
    },

    hasSubscribers(event: keyof TEvents): boolean {
      return (subscribers.get(event)?.size ?? 0) > 0;
    },
  };
}

// ============================================================================
// Observable State
// ============================================================================

/**
 * Observable value
 */
export interface ObservableValue<T> {
  /** Get current value */
  get(): T;
  /** Set new value */
  set(value: T | ((prev: T) => T)): void;
  /** Subscribe to changes */
  subscribe(listener: (value: T, prev: T) => void): () => void;
  /** Update value with function */
  update(updater: (value: T) => T): void;
}

/**
 * Create an observable value
 * @param initialValue - Initial value
 * @returns Observable value
 * @example
 * const count = createObservable(0);
 * count.subscribe((value) => console.log(value));
 * count.set(1); // logs: 1
 */
export function createObservable<T>(initialValue: T): ObservableValue<T> {
  let value = initialValue;
  const listeners = new Set<(value: T, prev: T) => void>();

  return {
    get(): T {
      return value;
    },

    set(newValue: T | ((prev: T) => T)): void {
      const prev = value;
      value =
        typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(prev)
          : newValue;

      if (value !== prev) {
        for (const listener of listeners) {
          listener(value, prev);
        }
      }
    },

    subscribe(listener: (value: T, prev: T) => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    update(updater: (value: T) => T): void {
      this.set(updater);
    },
  };
}

/**
 * Create a computed observable from other observables
 */
export function createComputed<T, D extends unknown[]>(
  dependencies: { [K in keyof D]: ObservableValue<D[K]> },
  compute: (...values: D) => T
): ObservableValue<T> & { readonly: true } {
  const getValues = () => dependencies.map(dep => dep.get()) as D;
  let value = compute(...getValues());
  const listeners = new Set<(value: T, prev: T) => void>();

  // Subscribe to all dependencies
  for (const dep of dependencies) {
    dep.subscribe(() => {
      const prev = value;
      value = compute(...getValues());
      if (value !== prev) {
        for (const listener of listeners) {
          listener(value, prev);
        }
      }
    });
  }

  return {
    readonly: true as const,

    get(): T {
      return value;
    },

    set(): void {
      throw new Error('Cannot set computed observable');
    },

    subscribe(listener: (value: T, prev: T) => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    update(): void {
      throw new Error('Cannot update computed observable');
    },
  };
}
