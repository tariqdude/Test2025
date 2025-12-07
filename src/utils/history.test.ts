/**
 * Tests for history utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createHistory,
  createPersistentHistory,
  createCommandHistory,
} from './history';
import type { Command } from './history';

describe('history utilities', () => {
  describe('createHistory', () => {
    it('should create history with initial state', () => {
      const history = createHistory({ count: 0 });
      expect(history.current()).toEqual({ count: 0 });
    });

    it('should push new states', () => {
      const history = createHistory({ count: 0 });
      history.push({ count: 1 });
      expect(history.current()).toEqual({ count: 1 });
    });

    it('should undo to previous state', () => {
      const history = createHistory({ count: 0 });
      history.push({ count: 1 });
      history.push({ count: 2 });

      const result = history.undo();
      expect(result).toEqual({ count: 1 });
      expect(history.current()).toEqual({ count: 1 });
    });

    it('should redo to next state', () => {
      const history = createHistory({ count: 0 });
      history.push({ count: 1 });
      history.undo();

      const result = history.redo();
      expect(result).toEqual({ count: 1 });
    });

    it('should return null when cannot undo', () => {
      const history = createHistory({ count: 0 });
      expect(history.undo()).toBe(null);
    });

    it('should return null when cannot redo', () => {
      const history = createHistory({ count: 0 });
      expect(history.redo()).toBe(null);
    });

    it('should clear redo stack on new push', () => {
      const history = createHistory({ count: 0 });
      history.push({ count: 1 });
      history.push({ count: 2 });
      history.undo();
      history.push({ count: 3 });

      expect(history.canRedo()).toBe(false);
    });

    it('should respect maxSize option', () => {
      const history = createHistory({ count: 0 }, { maxSize: 3 });

      history.push({ count: 1 });
      history.push({ count: 2 });
      history.push({ count: 3 });
      history.push({ count: 4 });

      const stats = history.getStats();
      expect(stats.totalSize).toBe(3);
    });

    it('should call onChange callback', () => {
      const onChange = vi.fn();
      const history = createHistory({ count: 0 }, { onChange });

      history.push({ count: 1 });
      expect(onChange).toHaveBeenCalled();
    });

    it('should support labels', () => {
      const history = createHistory({ count: 0 });
      history.push({ count: 1 }, 'first-change');
      history.push({ count: 2 }, 'second-change');

      const found = history.findByLabel('first-change');
      expect(found).toHaveLength(1);
      expect(found[0].entry.state).toEqual({ count: 1 });
    });

    it('should goTo specific index', () => {
      const history = createHistory({ count: 0 });
      history.push({ count: 1 });
      history.push({ count: 2 });
      history.push({ count: 3 });

      const result = history.goTo(1);
      expect(result).toEqual({ count: 1 });
    });

    it('should clear history', () => {
      const history = createHistory({ count: 0 });
      history.push({ count: 1 });
      history.push({ count: 2 });

      history.clear();

      expect(history.canUndo()).toBe(false);
      expect(history.current()).toEqual({ count: 2 });
    });

    it('should reset to initial state', () => {
      const history = createHistory({ count: 0 });
      history.push({ count: 1 });
      history.push({ count: 2 });

      history.reset();

      expect(history.current()).toEqual({ count: 0 });
      expect(history.canUndo()).toBe(false);
    });

    it('should batch changes', () => {
      const history = createHistory({ count: 0 });

      history.batch(state => ({ count: state.count + 5 }), 'batch-update');

      expect(history.current()).toEqual({ count: 5 });
      expect(history.canUndo()).toBe(true);
    });

    it('should provide correct stats', () => {
      const history = createHistory({ count: 0 });
      history.push({ count: 1 });
      history.push({ count: 2 });
      history.undo();

      const stats = history.getStats();
      expect(stats.canUndo).toBe(true);
      expect(stats.canRedo).toBe(true);
      expect(stats.undoCount).toBe(1);
      expect(stats.redoCount).toBe(1);
    });

    it('should clone states to prevent mutation', () => {
      const initial = { count: 0, nested: { value: 1 } };
      const history = createHistory(initial);

      const current = history.current();
      current.nested.value = 999;

      expect(history.current().nested.value).toBe(1);
    });
  });

  describe('createPersistentHistory', () => {
    it('should persist state to storage', () => {
      const storage = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      } as unknown as Storage;

      const history = createPersistentHistory(
        'test-key',
        { count: 0 },
        { storage }
      );
      history.push({ count: 1 });

      expect(storage.setItem).toHaveBeenCalledWith('test-key', '{"count":1}');
    });

    it('should restore state from storage', () => {
      const storage = {
        getItem: vi.fn().mockReturnValue('{"count":5}'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      } as unknown as Storage;

      const history = createPersistentHistory(
        'test-key',
        { count: 0 },
        { storage }
      );

      expect(history.current()).toEqual({ count: 5 });
    });

    it('should clear persisted state', () => {
      const storage = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      } as unknown as Storage;

      const history = createPersistentHistory(
        'test-key',
        { count: 0 },
        { storage }
      );
      history.clearPersisted();

      expect(storage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('createCommandHistory', () => {
    interface State {
      count: number;
    }

    const createIncrementCommand = (amount: number): Command<State> => ({
      execute: state => ({ count: state.count + amount }),
      undo: state => ({ count: state.count - amount }),
      label: `increment-${amount}`,
    });

    it('should execute commands', () => {
      const history = createCommandHistory<State>({ count: 0 });
      const result = history.execute(createIncrementCommand(5));

      expect(result).toEqual({ count: 5 });
    });

    it('should undo commands', () => {
      const history = createCommandHistory<State>({ count: 0 });
      history.execute(createIncrementCommand(5));
      const result = history.undo();

      expect(result).toEqual({ count: 0 });
    });

    it('should redo commands', () => {
      const history = createCommandHistory<State>({ count: 0 });
      history.execute(createIncrementCommand(5));
      history.undo();
      const result = history.redo();

      expect(result).toEqual({ count: 5 });
    });

    it('should return null when cannot undo', () => {
      const history = createCommandHistory<State>({ count: 0 });
      expect(history.undo()).toBe(null);
    });

    it('should return null when cannot redo', () => {
      const history = createCommandHistory<State>({ count: 0 });
      expect(history.redo()).toBe(null);
    });

    it('should clear all commands', () => {
      const history = createCommandHistory<State>({ count: 0 });
      history.execute(createIncrementCommand(5));
      history.clear();

      expect(history.canUndo()).toBe(false);
    });

    it('should reset to initial state', () => {
      const history = createCommandHistory<State>({ count: 0 });
      history.execute(createIncrementCommand(5));
      history.reset();

      expect(history.current()).toEqual({ count: 0 });
    });
  });
});
