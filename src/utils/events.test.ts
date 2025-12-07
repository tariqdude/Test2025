import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from './events';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should subscribe and emit events', () => {
    const handler = vi.fn();
    emitter.on('test', handler);
    emitter.emit('test', 'data');
    expect(handler).toHaveBeenCalledWith('data');
  });

  it('should unsubscribe', () => {
    const handler = vi.fn();
    const unsubscribe = emitter.on('test', handler);
    unsubscribe();
    emitter.emit('test', 'data');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle once option', () => {
    const handler = vi.fn();
    emitter.on('test', handler, { once: true });
    emitter.emit('test', 'data');
    emitter.emit('test', 'data');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle debounce', () => {
    const handler = vi.fn();
    emitter.on('test', handler, { debounce: 100 });

    emitter.emit('test', '1');
    emitter.emit('test', '2');
    emitter.emit('test', '3');

    vi.advanceTimersByTime(100);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('3');
  });

  it('should handle throttle', () => {
    const handler = vi.fn();
    emitter.on('test', handler, { throttle: 100 });

    emitter.emit('test', '1'); // Called immediately
    emitter.emit('test', '2'); // Ignored

    vi.advanceTimersByTime(50);
    emitter.emit('test', '3'); // Ignored

    vi.advanceTimersByTime(51); // 101ms total
    emitter.emit('test', '4'); // Called

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, '1');
    expect(handler).toHaveBeenNthCalledWith(2, '4');
  });
});
