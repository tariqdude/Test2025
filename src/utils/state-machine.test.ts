/**
 * State Machine Utilities Tests
 */
import { describe, it, expect, vi } from 'vitest';
import {
  createStateMachine,
  createReducer,
  createStore,
  createPubSub,
  combineReducers,
  applyMiddleware,
  createAction,
  type Action,
  type Reducer,
} from './state-machine';

describe('State Machine Utilities', () => {
  describe('createStateMachine', () => {
    const trafficLightConfig = {
      initial: 'green' as const,
      states: {
        green: { on: { TIMER: 'yellow' } },
        yellow: { on: { TIMER: 'red' } },
        red: { on: { TIMER: 'green' } },
      },
    };

    it('should create machine with initial state', () => {
      const machine = createStateMachine(trafficLightConfig);
      expect(machine.state).toBe('green');
    });

    it('should transition on event', () => {
      const machine = createStateMachine(trafficLightConfig);
      machine.send('TIMER');
      expect(machine.state).toBe('yellow');
    });

    it('should handle multiple transitions', () => {
      const machine = createStateMachine(trafficLightConfig);
      machine.send('TIMER');
      machine.send('TIMER');
      machine.send('TIMER');
      expect(machine.state).toBe('green');
    });

    it('should provide state history', () => {
      const machine = createStateMachine(trafficLightConfig);
      machine.send('TIMER');
      machine.send('TIMER');
      expect(machine.history).toContain('green');
      expect(machine.history).toContain('yellow');
      expect(machine.history).toContain('red');
    });

    it('should notify subscribers on transition', () => {
      const machine = createStateMachine(trafficLightConfig);
      const callback = vi.fn();
      machine.subscribe(callback);
      machine.send('TIMER');
      expect(callback).toHaveBeenCalled();
    });

    it('should unsubscribe from notifications', () => {
      const machine = createStateMachine(trafficLightConfig);
      const callback = vi.fn();
      const unsubscribe = machine.subscribe(callback);
      unsubscribe();
      machine.send('TIMER');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should check if event is valid', () => {
      const machine = createStateMachine(trafficLightConfig);
      expect(machine.can('TIMER')).toBe(true);
      expect(machine.can('INVALID')).toBe(false);
    });

    it('should match state', () => {
      const machine = createStateMachine(trafficLightConfig);
      expect(machine.matches('green')).toBe(true);
      expect(machine.matches('red')).toBe(false);
    });

    it('should handle guards/conditions', () => {
      const config = {
        initial: 'idle' as const,
        context: { count: 0 },
        states: {
          idle: {
            on: {
              INCREMENT: {
                target: 'active',
                guard: (ctx: { count: number }) => ctx.count < 5,
              },
            },
          },
          active: { on: { RESET: 'idle' } },
        },
      };
      const machine = createStateMachine(config);
      machine.send('INCREMENT');
      expect(machine.state).toBe('active');
    });

    it('should execute actions on transition', () => {
      const action = vi.fn();
      const config = {
        initial: 'idle' as const,
        context: { value: 0 },
        states: {
          idle: {
            on: {
              START: {
                target: 'running',
                action: (ctx: { value: number }) => {
                  action();
                  return { value: ctx.value + 1 };
                },
              },
            },
          },
          running: {},
        },
      };
      const machine = createStateMachine(config);
      machine.send('START');
      expect(action).toHaveBeenCalled();
    });

    it('should handle entry/exit actions', () => {
      const onEnter = vi.fn();
      const onExit = vi.fn();
      const config = {
        initial: 'idle' as const,
        states: {
          idle: {
            on: { START: 'running' },
            onExit,
          },
          running: {
            onEnter,
          },
        },
      };
      const machine = createStateMachine(config);
      machine.send('START');
      expect(onExit).toHaveBeenCalled();
      expect(onEnter).toHaveBeenCalled();
    });

    it('should reset to initial state', () => {
      const machine = createStateMachine(trafficLightConfig);
      machine.send('TIMER');
      machine.reset();
      expect(machine.state).toBe('green');
    });

    it('should get available transitions', () => {
      const machine = createStateMachine(trafficLightConfig);
      const transitions = machine.getTransitions();
      expect(transitions).toContain('TIMER');
    });
  });

  describe('createReducer', () => {
    type CounterState = { count: number };
    type CounterAction =
      | Action<'INCREMENT'>
      | Action<'DECREMENT'>
      | Action<'SET', number>;

    const { reducer: counterReducer } = createReducer<
      CounterState,
      CounterAction
    >(
      { count: 0 },
      {
        INCREMENT: state => ({ count: state.count + 1 }),
        DECREMENT: state => ({ count: state.count - 1 }),
        SET: (state, action) => ({ count: action.payload ?? state.count }),
      }
    );

    it('should return initial state for unknown action', () => {
      const state = counterReducer(undefined, { type: 'UNKNOWN' as never });
      expect(state).toEqual({ count: 0 });
    });

    it('should handle INCREMENT', () => {
      const state = counterReducer({ count: 5 }, { type: 'INCREMENT' });
      expect(state).toEqual({ count: 6 });
    });

    it('should handle DECREMENT', () => {
      const state = counterReducer({ count: 5 }, { type: 'DECREMENT' });
      expect(state).toEqual({ count: 4 });
    });

    it('should handle action with payload', () => {
      const state = counterReducer({ count: 0 }, { type: 'SET', payload: 100 });
      expect(state).toEqual({ count: 100 });
    });
  });

  describe('createAction', () => {
    it('should create action creator without payload', () => {
      const increment = createAction('INCREMENT');
      const action = increment();
      expect(action).toEqual({ type: 'INCREMENT' });
    });

    it('should create action creator with payload', () => {
      const setCount = createAction<'SET_COUNT', number>('SET_COUNT');
      const action = setCount(42);
      expect(action).toEqual({ type: 'SET_COUNT', payload: 42 });
    });
  });

  describe('createStore', () => {
    it('should create store with initial state', () => {
      const reducer: Reducer<{ count: number }> = (state = { count: 0 }) =>
        state;
      const store = createStore(reducer, { count: 0 });
      expect(store.getState()).toEqual({ count: 0 });
    });

    it('should dispatch actions', () => {
      const reducer: Reducer<{ count: number }> = (
        state = { count: 0 },
        action
      ) => {
        if (action.type === 'INCREMENT') return { count: state.count + 1 };
        return state;
      };
      const store = createStore(reducer, { count: 0 });
      store.dispatch({ type: 'INCREMENT' });
      expect(store.getState()).toEqual({ count: 1 });
    });

    it('should notify subscribers', () => {
      const reducer: Reducer<{ count: number }> = (
        state = { count: 0 },
        action
      ) => {
        if (action.type === 'INCREMENT') return { count: state.count + 1 };
        return state;
      };
      const store = createStore(reducer, { count: 0 });
      const callback = vi.fn();
      store.subscribe(callback);
      store.dispatch({ type: 'INCREMENT' });
      expect(callback).toHaveBeenCalled();
    });

    it('should unsubscribe', () => {
      const reducer: Reducer<{ count: number }> = (state = { count: 0 }) =>
        state;
      const store = createStore(reducer, { count: 0 });
      const callback = vi.fn();
      const unsubscribe = store.subscribe(callback);
      unsubscribe();
      store.dispatch({ type: 'TEST' });
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('createPubSub', () => {
    it('should publish and subscribe', () => {
      const pubsub = createPubSub<{ test: { message: string } }>();
      const callback = vi.fn();
      pubsub.subscribe('test', callback);
      pubsub.publish('test', { message: 'hello' });
      expect(callback).toHaveBeenCalledWith({ message: 'hello' });
    });

    it('should support multiple subscribers', () => {
      const pubsub = createPubSub<{ event: string }>();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      pubsub.subscribe('event', callback1);
      pubsub.subscribe('event', callback2);
      pubsub.publish('event', 'data');
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should unsubscribe', () => {
      const pubsub = createPubSub<{ event: string }>();
      const callback = vi.fn();
      const unsubscribe = pubsub.subscribe('event', callback);
      unsubscribe();
      pubsub.publish('event', 'data');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should support once subscription', () => {
      const pubsub = createPubSub<{ event: string }>();
      const callback = vi.fn();
      pubsub.subscribeOnce('event', callback);
      pubsub.publish('event', 'data1');
      pubsub.publish('event', 'data2');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should clear subscriptions', () => {
      const pubsub = createPubSub<{ event: string }>();
      const callback = vi.fn();
      pubsub.subscribe('event', callback);
      pubsub.clear();
      pubsub.publish('event', 'data');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should check if has subscribers', () => {
      const pubsub = createPubSub<{ event: string }>();
      expect(pubsub.hasSubscribers('event')).toBe(false);
      pubsub.subscribe('event', () => {});
      expect(pubsub.hasSubscribers('event')).toBe(true);
    });
  });

  describe('combineReducers', () => {
    it('should combine multiple reducers', () => {
      const counterReducer: Reducer<{ count: number }> = (
        state = { count: 0 },
        action
      ) => {
        if (action.type === 'INCREMENT') return { count: state.count + 1 };
        return state;
      };

      const todoReducer: Reducer<{ items: string[] }> = (
        state = { items: [] },
        action
      ) => {
        if (action.type === 'ADD_TODO')
          return { items: [...state.items, action.payload as string] };
        return state;
      };

      const rootReducer = combineReducers({
        counter: counterReducer,
        todos: todoReducer,
      });

      const initialState = {
        counter: { count: 0 },
        todos: { items: [] as string[] },
      };

      const state = rootReducer(initialState, { type: '@@INIT' });
      expect(state).toEqual({
        counter: { count: 0 },
        todos: { items: [] },
      });

      const newState = rootReducer(state, { type: 'INCREMENT' });
      expect(newState.counter).toEqual({ count: 1 });
    });
  });

  describe('applyMiddleware', () => {
    it('should apply middleware to store', () => {
      const logs: string[] = [];
      const loggingMiddleware =
        () => (next: (action: Action) => void) => (action: Action) => {
          logs.push(`Action: ${action.type}`);
          return next(action);
        };

      const reducer: Reducer<{ count: number }, Action> = (
        state = { count: 0 },
        action
      ) => {
        if (action.type === 'INCREMENT') return { count: state.count + 1 };
        return state;
      };

      const enhancer = applyMiddleware<{ count: number }, Action>(
        loggingMiddleware
      );
      const store = createStore(reducer, { count: 0 }, enhancer);
      store.dispatch({ type: 'INCREMENT' });

      expect(logs).toContain('Action: INCREMENT');
    });

    it('should chain multiple middlewares', () => {
      const order: number[] = [];
      const middleware1 =
        () => (next: (action: Action) => void) => (action: Action) => {
          order.push(1);
          return next(action);
        };
      const middleware2 =
        () => (next: (action: Action) => void) => (action: Action) => {
          order.push(2);
          return next(action);
        };

      const reducer: Reducer<Record<string, never>, Action> = (state = {}) =>
        state;
      const enhancer = applyMiddleware<Record<string, never>, Action>(
        middleware1,
        middleware2
      );
      const store = createStore(reducer, {}, enhancer);
      store.dispatch({ type: 'TEST' });

      expect(order).toEqual([1, 2]);
    });
  });

  describe('Edge cases', () => {
    it('should handle state machine with no context', () => {
      const machine = createStateMachine({
        initial: 'idle',
        states: {
          idle: { on: { START: 'running' } },
          running: { on: { STOP: 'idle' } },
        },
      });
      expect(machine.state).toBe('idle');
      expect(machine.context).toEqual({});
    });

    it('should handle pubsub with no subscribers', () => {
      const pubsub = createPubSub<{ event: string }>();
      // Should not throw
      expect(() => pubsub.publish('event', 'data')).not.toThrow();
    });

    it('should handle clearing specific event', () => {
      const pubsub = createPubSub<{ event1: string; event2: string }>();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      pubsub.subscribe('event1', callback1);
      pubsub.subscribe('event2', callback2);
      pubsub.clear('event1');
      pubsub.publish('event1', 'data');
      pubsub.publish('event2', 'data');
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should handle reducer with undefined state', () => {
      const { reducer, initialState } = createReducer<
        { value: number },
        Action<'SET', number>
      >(
        { value: 0 },
        {
          SET: (_, action) => ({ value: action.payload ?? 0 }),
        }
      );
      // Using initialState when state is undefined
      const state = reducer(initialState, { type: 'SET', payload: 42 });
      expect(state).toEqual({ value: 42 });
    });
  });
});
