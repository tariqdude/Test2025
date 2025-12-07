/**
 * History Manager (Undo/Redo)
 * @module utils/history
 * @description A generic undo/redo history manager with support for
 * state snapshots, branching, and memory limits.
 */

/**
 * History entry with metadata
 */
export interface HistoryEntry<T> {
  state: T;
  timestamp: number;
  label?: string;
}

/**
 * History manager options
 */
export interface HistoryOptions {
  /** Maximum number of states to keep */
  maxSize?: number;
  /** Enable branching (keep redo stack on new action) */
  branching?: boolean;
  /** Callback when history changes */
  onChange?: () => void;
}

/**
 * History manager statistics
 */
export interface HistoryStats {
  undoCount: number;
  redoCount: number;
  totalSize: number;
  maxSize: number;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Create a history manager for undo/redo functionality
 * @param initialState - The initial state
 * @param options - Configuration options
 * @example
 * const history = createHistory({ count: 0 });
 * history.push({ count: 1 });
 * history.push({ count: 2 });
 * history.undo(); // { count: 1 }
 * history.redo(); // { count: 2 }
 */
export function createHistory<T>(
  initialState: T,
  options: HistoryOptions = {}
) {
  const { maxSize = 100, branching = false, onChange } = options;

  const undoStack: HistoryEntry<T>[] = [
    {
      state: structuredClone(initialState),
      timestamp: Date.now(),
    },
  ];
  let redoStack: HistoryEntry<T>[] = [];
  let currentIndex = 0;

  const notifyChange = () => {
    onChange?.();
  };

  const trimStack = () => {
    while (undoStack.length > maxSize) {
      undoStack.shift();
      currentIndex = Math.max(0, currentIndex - 1);
    }
  };

  return {
    /**
     * Push a new state onto the history
     * @param state - The new state
     * @param label - Optional label for this state
     */
    push(state: T, label?: string): void {
      // Remove any states after current position (unless branching)
      if (!branching) {
        undoStack.splice(currentIndex + 1);
        redoStack = [];
      }

      undoStack.push({
        state: structuredClone(state),
        timestamp: Date.now(),
        label,
      });

      currentIndex = undoStack.length - 1;
      trimStack();
      notifyChange();
    },

    /**
     * Undo to the previous state
     * @returns The previous state or null if at beginning
     */
    undo(): T | null {
      if (currentIndex <= 0) return null;

      // Save current to redo stack
      redoStack.push(undoStack[currentIndex]);
      currentIndex--;

      notifyChange();
      return structuredClone(undoStack[currentIndex].state);
    },

    /**
     * Redo to the next state
     * @returns The next state or null if at end
     */
    redo(): T | null {
      if (redoStack.length === 0) return null;

      const entry = redoStack.pop()!;
      currentIndex++;

      // Ensure entry is at the right position
      if (currentIndex >= undoStack.length) {
        undoStack.push(entry);
      }

      notifyChange();
      return structuredClone(entry.state);
    },

    /**
     * Get the current state
     */
    current(): T {
      return structuredClone(undoStack[currentIndex].state);
    },

    /**
     * Get the current state entry with metadata
     */
    currentEntry(): HistoryEntry<T> {
      return { ...undoStack[currentIndex] };
    },

    /**
     * Check if undo is available
     */
    canUndo(): boolean {
      return currentIndex > 0;
    },

    /**
     * Check if redo is available
     */
    canRedo(): boolean {
      return redoStack.length > 0;
    },

    /**
     * Go to a specific index in history
     * @param index - The target index
     */
    goTo(index: number): T | null {
      if (index < 0 || index >= undoStack.length) return null;

      // Save states between current and target to appropriate stack
      if (index < currentIndex) {
        for (let i = currentIndex; i > index; i--) {
          redoStack.push(undoStack[i]);
        }
      } else if (index > currentIndex) {
        // Clear redo states that we're skipping over
        redoStack = redoStack.slice(
          0,
          redoStack.length - (index - currentIndex)
        );
      }

      currentIndex = index;
      notifyChange();
      return structuredClone(undoStack[currentIndex].state);
    },

    /**
     * Get all entries in the undo stack
     */
    getUndoStack(): HistoryEntry<T>[] {
      return undoStack.slice(0, currentIndex + 1).map(e => ({ ...e }));
    },

    /**
     * Get all entries in the redo stack
     */
    getRedoStack(): HistoryEntry<T>[] {
      return redoStack.map(e => ({ ...e }));
    },

    /**
     * Get history statistics
     */
    getStats(): HistoryStats {
      return {
        undoCount: currentIndex,
        redoCount: redoStack.length,
        totalSize: undoStack.length,
        maxSize,
        canUndo: currentIndex > 0,
        canRedo: redoStack.length > 0,
      };
    },

    /**
     * Clear all history except current state
     */
    clear(): void {
      const current = undoStack[currentIndex];
      undoStack.length = 0;
      undoStack.push(current);
      redoStack = [];
      currentIndex = 0;
      notifyChange();
    },

    /**
     * Reset to initial state and clear history
     */
    reset(): void {
      undoStack.length = 0;
      undoStack.push({
        state: structuredClone(initialState),
        timestamp: Date.now(),
      });
      redoStack = [];
      currentIndex = 0;
      notifyChange();
    },

    /**
     * Batch multiple changes into a single history entry
     * @param fn - Function that makes changes
     * @param label - Optional label for the batch
     */
    batch(fn: (state: T) => T, label?: string): void {
      const current = this.current();
      const newState = fn(current);
      this.push(newState, label);
    },

    /**
     * Find entries by label
     * @param label - Label to search for
     */
    findByLabel(
      label: string
    ): Array<{ index: number; entry: HistoryEntry<T> }> {
      return undoStack
        .map((entry, index) => ({ index, entry }))
        .filter(({ entry }) => entry.label === label);
    },

    /**
     * Get the current index in history
     */
    getCurrentIndex(): number {
      return currentIndex;
    },
  };
}

/**
 * Create a history manager that auto-saves on changes
 * @param key - Storage key
 * @param initialState - The initial state
 * @param options - Configuration options
 */
export function createPersistentHistory<T>(
  key: string,
  initialState: T,
  options: HistoryOptions & { storage?: Storage } = {}
) {
  const storage =
    options.storage ??
    (typeof localStorage !== 'undefined' ? localStorage : null);

  // Try to restore from storage
  let restoredState = initialState;
  if (storage) {
    try {
      const saved = storage.getItem(key);
      if (saved) {
        restoredState = JSON.parse(saved);
      }
    } catch {
      // Use initial state
    }
  }

  const history = createHistory(restoredState, {
    ...options,
    onChange: () => {
      options.onChange?.();
      // Persist current state
      if (storage) {
        try {
          storage.setItem(key, JSON.stringify(history.current()));
        } catch {
          // Storage full or unavailable
        }
      }
    },
  });

  return {
    ...history,

    /**
     * Clear persisted state
     */
    clearPersisted(): void {
      storage?.removeItem(key);
    },
  };
}

/**
 * Type for command pattern with undo/redo
 */
export interface Command<T> {
  execute(state: T): T;
  undo(state: T): T;
  label?: string;
}

/**
 * Create a command-based history manager
 * Useful for complex operations that need explicit undo logic
 */
export function createCommandHistory<T>(
  initialState: T,
  options: HistoryOptions = {}
) {
  let state = structuredClone(initialState);
  const executedCommands: Command<T>[] = [];
  const undoneCommands: Command<T>[] = [];
  const { maxSize = 100, onChange } = options;

  const notifyChange = () => {
    onChange?.();
  };

  return {
    /**
     * Execute a command
     */
    execute(command: Command<T>): T {
      state = command.execute(structuredClone(state));
      executedCommands.push(command);
      undoneCommands.length = 0;

      // Trim if needed
      while (executedCommands.length > maxSize) {
        executedCommands.shift();
      }

      notifyChange();
      return structuredClone(state);
    },

    /**
     * Undo the last command
     */
    undo(): T | null {
      if (executedCommands.length === 0) return null;

      const command = executedCommands.pop()!;
      state = command.undo(structuredClone(state));
      undoneCommands.push(command);

      notifyChange();
      return structuredClone(state);
    },

    /**
     * Redo the last undone command
     */
    redo(): T | null {
      if (undoneCommands.length === 0) return null;

      const command = undoneCommands.pop()!;
      state = command.execute(structuredClone(state));
      executedCommands.push(command);

      notifyChange();
      return structuredClone(state);
    },

    /**
     * Get current state
     */
    current(): T {
      return structuredClone(state);
    },

    /**
     * Check if undo is available
     */
    canUndo(): boolean {
      return executedCommands.length > 0;
    },

    /**
     * Check if redo is available
     */
    canRedo(): boolean {
      return undoneCommands.length > 0;
    },

    /**
     * Clear all commands
     */
    clear(): void {
      executedCommands.length = 0;
      undoneCommands.length = 0;
      notifyChange();
    },

    /**
     * Reset to initial state
     */
    reset(): void {
      state = structuredClone(initialState);
      this.clear();
    },
  };
}
