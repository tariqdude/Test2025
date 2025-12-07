/**
 * Collections Utilities Tests
 */
import { describe, it, expect } from 'vitest';
import {
  PriorityQueue,
  MaxPriorityQueue,
  LRUCache,
  LFUCache,
  CircularBuffer,
  Deque,
  BloomFilter,
  Trie,
  DisjointSet,
  IntervalTree,
  memoizeWithLRU,
  slidingWindow,
  createMovingAverage,
} from '../utils/collections';

describe('Collections Utilities', () => {
  describe('PriorityQueue', () => {
    it('should dequeue items in priority order', () => {
      const pq = new PriorityQueue<string>();
      pq.enqueue('low', 3);
      pq.enqueue('high', 1);
      pq.enqueue('medium', 2);

      expect(pq.dequeue()).toBe('high');
      expect(pq.dequeue()).toBe('medium');
      expect(pq.dequeue()).toBe('low');
    });

    it('should report size correctly', () => {
      const pq = new PriorityQueue<number>();
      expect(pq.size).toBe(0);
      expect(pq.isEmpty).toBe(true);

      pq.enqueue(1, 1);
      expect(pq.size).toBe(1);
      expect(pq.isEmpty).toBe(false);
    });

    it('should peek without removing', () => {
      const pq = new PriorityQueue<string>();
      pq.enqueue('first', 1);
      pq.enqueue('second', 2);

      expect(pq.peek()).toBe('first');
      expect(pq.size).toBe(2);
    });

    it('should handle equal priorities', () => {
      const pq = new PriorityQueue<string>();
      pq.enqueue('a', 1);
      pq.enqueue('b', 1);
      pq.enqueue('c', 1);

      expect(pq.size).toBe(3);
    });

    it('should return undefined when empty', () => {
      const pq = new PriorityQueue<string>();
      expect(pq.dequeue()).toBeUndefined();
      expect(pq.peek()).toBeUndefined();
    });

    it('should convert to sorted array', () => {
      const pq = new PriorityQueue<number>();
      pq.enqueue(3, 3);
      pq.enqueue(1, 1);
      pq.enqueue(2, 2);

      expect(pq.toArray()).toEqual([1, 2, 3]);
    });

    it('should clear queue', () => {
      const pq = new PriorityQueue<number>();
      pq.enqueue(1, 1);
      pq.enqueue(2, 2);
      pq.clear();

      expect(pq.isEmpty).toBe(true);
    });

    it('should accept initial items', () => {
      const pq = new PriorityQueue([
        { value: 'a', priority: 3 },
        { value: 'b', priority: 1 },
        { value: 'c', priority: 2 },
      ]);

      expect(pq.dequeue()).toBe('b');
    });
  });

  describe('MaxPriorityQueue', () => {
    it('should dequeue items in max priority order', () => {
      const pq = new MaxPriorityQueue<string>();
      pq.enqueue('low', 1);
      pq.enqueue('high', 3);
      pq.enqueue('medium', 2);

      expect(pq.dequeue()).toBe('high');
      expect(pq.dequeue()).toBe('medium');
      expect(pq.dequeue()).toBe('low');
    });
  });

  describe('LRUCache', () => {
    it('should store and retrieve values', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);

      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
    });

    it('should evict least recently used', () => {
      const cache = new LRUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
      expect(cache.has('c')).toBe(true);
    });

    it('should update LRU order on get', () => {
      const cache = new LRUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.get('a'); // Makes 'a' most recent
      cache.set('c', 3);

      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    it('should update existing values', () => {
      const cache = new LRUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('a', 2);

      expect(cache.get('a')).toBe(2);
      expect(cache.size).toBe(1);
    });

    it('should delete values', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.delete('a');

      expect(cache.has('a')).toBe(false);
    });

    it('should clear cache', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();

      expect(cache.size).toBe(0);
    });

    it('should return keys/values/entries in LRU order', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.get('a'); // Makes 'a' most recent

      const keys = cache.keys();
      expect(keys[0]).toBe('a');
    });

    it('should throw for invalid capacity', () => {
      expect(() => new LRUCache(0)).toThrow();
      expect(() => new LRUCache(-1)).toThrow();
    });
  });

  describe('LFUCache', () => {
    it('should store and retrieve values', () => {
      const cache = new LFUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);

      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
    });

    it('should evict least frequently used', () => {
      const cache = new LFUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.get('a'); // Increase frequency of 'a'
      cache.set('c', 3); // Should evict 'b'

      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
    });

    it('should track frequency on get', () => {
      const cache = new LFUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.get('a');
      cache.get('a');
      cache.get('b');
      cache.set('c', 3); // Should evict 'b' (freq=2) not 'a' (freq=3)

      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    it('should update existing values', () => {
      const cache = new LFUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('a', 2);

      expect(cache.get('a')).toBe(2);
      expect(cache.size).toBe(1);
    });

    it('should delete values', () => {
      const cache = new LFUCache<string, number>(3);
      cache.set('a', 1);
      cache.delete('a');

      expect(cache.has('a')).toBe(false);
    });

    it('should throw for invalid capacity', () => {
      expect(() => new LFUCache(0)).toThrow();
      expect(() => new LFUCache(-1)).toThrow();
    });
  });

  describe('CircularBuffer', () => {
    it('should store values up to capacity', () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.size).toBe(3);
      expect(buffer.toArray()).toEqual([1, 2, 3]);
    });

    it('should overwrite oldest on overflow', () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      const overwritten = buffer.push(4);

      expect(overwritten).toBe(1);
      expect(buffer.toArray()).toEqual([2, 3, 4]);
    });

    it('should shift oldest values', () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.shift()).toBe(1);
      expect(buffer.size).toBe(2);
    });

    it('should peek at oldest and newest', () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.peek()).toBe(1);
      expect(buffer.peekLast()).toBe(3);
    });

    it('should access by index', () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      expect(buffer.at(0)).toBe(1);
      expect(buffer.at(2)).toBe(3);
      expect(buffer.at(3)).toBeUndefined();
    });

    it('should report full/empty status', () => {
      const buffer = new CircularBuffer<number>(2);

      expect(buffer.isEmpty).toBe(true);
      expect(buffer.isFull).toBe(false);

      buffer.push(1);
      buffer.push(2);

      expect(buffer.isEmpty).toBe(false);
      expect(buffer.isFull).toBe(true);
    });

    it('should clear buffer', () => {
      const buffer = new CircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.clear();

      expect(buffer.isEmpty).toBe(true);
    });

    it('should throw for invalid capacity', () => {
      expect(() => new CircularBuffer(0)).toThrow();
      expect(() => new CircularBuffer(-1)).toThrow();
    });
  });

  describe('Deque', () => {
    it('should push to front and back', () => {
      const deque = new Deque<number>();
      deque.pushBack(2);
      deque.pushFront(1);
      deque.pushBack(3);

      expect(deque.toArray()).toEqual([1, 2, 3]);
    });

    it('should pop from front and back', () => {
      const deque = new Deque<number>();
      deque.pushBack(1);
      deque.pushBack(2);
      deque.pushBack(3);

      expect(deque.popFront()).toBe(1);
      expect(deque.popBack()).toBe(3);
      expect(deque.size).toBe(1);
    });

    it('should peek at front and back', () => {
      const deque = new Deque<number>();
      deque.pushBack(1);
      deque.pushBack(2);
      deque.pushBack(3);

      expect(deque.peekFront()).toBe(1);
      expect(deque.peekBack()).toBe(3);
    });

    it('should handle empty deque', () => {
      const deque = new Deque<number>();

      expect(deque.isEmpty).toBe(true);
      expect(deque.popFront()).toBeUndefined();
      expect(deque.popBack()).toBeUndefined();
    });

    it('should clear deque', () => {
      const deque = new Deque<number>();
      deque.pushBack(1);
      deque.pushBack(2);
      deque.clear();

      expect(deque.isEmpty).toBe(true);
    });
  });

  describe('BloomFilter', () => {
    it('should add and check membership', () => {
      const filter = new BloomFilter(100, 0.01);
      filter.add('hello');
      filter.add('world');

      expect(filter.mightContain('hello')).toBe(true);
      expect(filter.mightContain('world')).toBe(true);
    });

    it('should return false for absent items', () => {
      const filter = new BloomFilter(100, 0.01);
      filter.add('hello');

      // Not guaranteed but very likely for small sets
      expect(filter.mightContain('missing')).toBe(false);
    });

    it('should handle various types', () => {
      const filter = new BloomFilter(100, 0.01);
      filter.add(123);
      filter.add(true);
      filter.add({ key: 'value' });

      expect(filter.mightContain(123)).toBe(true);
      expect(filter.mightContain(true)).toBe(true);
    });

    it('should report fill ratio', () => {
      const filter = new BloomFilter(100, 0.01);

      expect(filter.getFillRatio()).toBe(0);

      filter.add('test');
      expect(filter.getFillRatio()).toBeGreaterThan(0);
    });
  });

  describe('Trie', () => {
    it('should insert and search words', () => {
      const trie = new Trie();
      trie.insert('hello');
      trie.insert('help');
      trie.insert('world');

      expect(trie.has('hello')).toBe(true);
      expect(trie.has('help')).toBe(true);
      expect(trie.has('hel')).toBe(false);
    });

    it('should check prefixes', () => {
      const trie = new Trie();
      trie.insert('hello');

      expect(trie.hasPrefix('hel')).toBe(true);
      expect(trie.hasPrefix('xyz')).toBe(false);
    });

    it('should get words with prefix', () => {
      const trie = new Trie();
      trie.insert('hello');
      trie.insert('help');
      trie.insert('world');

      const words = trie.getWordsWithPrefix('hel');
      expect(words).toContain('hello');
      expect(words).toContain('help');
      expect(words).not.toContain('world');
    });

    it('should store values', () => {
      const trie = new Trie<number>();
      trie.insert('one', 1);
      trie.insert('two', 2);

      expect(trie.get('one')).toBe(1);
      expect(trie.get('two')).toBe(2);
      expect(trie.get('three')).toBeUndefined();
    });

    it('should delete words', () => {
      const trie = new Trie();
      trie.insert('hello');
      trie.insert('help');

      expect(trie.delete('hello')).toBe(true);
      expect(trie.has('hello')).toBe(false);
      expect(trie.has('help')).toBe(true);
    });

    it('should get all words', () => {
      const trie = new Trie();
      trie.insert('a');
      trie.insert('b');
      trie.insert('c');

      const words = trie.getAllWords();
      expect(words).toContain('a');
      expect(words).toContain('b');
      expect(words).toContain('c');
    });

    it('should report size', () => {
      const trie = new Trie();
      expect(trie.size).toBe(0);

      trie.insert('hello');
      expect(trie.size).toBe(1);

      trie.insert('world');
      expect(trie.size).toBe(2);
    });

    it('should clear trie', () => {
      const trie = new Trie();
      trie.insert('hello');
      trie.clear();

      expect(trie.size).toBe(0);
      expect(trie.has('hello')).toBe(false);
    });
  });

  describe('DisjointSet', () => {
    it('should find representatives', () => {
      const ds = new DisjointSet<number>();
      ds.makeSet(1);
      ds.makeSet(2);

      expect(ds.find(1)).toBe(1);
      expect(ds.find(2)).toBe(2);
    });

    it('should union sets', () => {
      const ds = new DisjointSet<number>();
      ds.makeSet(1);
      ds.makeSet(2);
      ds.makeSet(3);

      expect(ds.union(1, 2)).toBe(true);
      expect(ds.connected(1, 2)).toBe(true);
      expect(ds.connected(1, 3)).toBe(false);
    });

    it('should return false for same-set union', () => {
      const ds = new DisjointSet<number>();
      ds.makeSet(1);
      ds.makeSet(2);
      ds.union(1, 2);

      expect(ds.union(1, 2)).toBe(false);
    });

    it('should get all sets', () => {
      const ds = new DisjointSet<number>();
      ds.makeSet(1);
      ds.makeSet(2);
      ds.makeSet(3);
      ds.union(1, 2);

      const sets = ds.getSets();
      expect(sets.size).toBe(2);
    });

    it('should auto-create sets on find', () => {
      const ds = new DisjointSet<number>();
      expect(ds.find(1)).toBe(1);
    });
  });

  describe('IntervalTree', () => {
    it('should insert and query intervals', () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, 'a');
      tree.insert(3, 8, 'b');
      tree.insert(10, 15, 'c');

      const overlapping = tree.queryOverlapping(4, 6);
      expect(overlapping.map(i => i.data)).toContain('a');
      expect(overlapping.map(i => i.data)).toContain('b');
      expect(overlapping.map(i => i.data)).not.toContain('c');
    });

    it('should query point', () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, 'a');
      tree.insert(3, 8, 'b');

      const atPoint = tree.queryPoint(4);
      expect(atPoint.length).toBe(2);
    });

    it('should handle non-overlapping query', () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, 'a');

      const overlapping = tree.queryOverlapping(10, 15);
      expect(overlapping.length).toBe(0);
    });
  });

  describe('memoizeWithLRU', () => {
    it('should cache function results', () => {
      let callCount = 0;
      const fn = (...args: unknown[]) => {
        callCount++;
        return (args[0] as number) * 2;
      };

      const memoized = memoizeWithLRU(fn, 10);

      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(callCount).toBe(1);
    });

    it('should respect capacity', () => {
      let callCount = 0;
      const fn = (...args: unknown[]) => {
        callCount++;
        return (args[0] as number) * 2;
      };

      const memoized = memoizeWithLRU(fn, 2);

      memoized(1);
      memoized(2);
      memoized(3); // Evicts 1
      memoized(1); // Should call again

      expect(callCount).toBe(4);
    });

    it('should use custom key function', () => {
      const fn = (...args: unknown[]) => (args[0] as { id: number }).id * 2;
      const memoized = memoizeWithLRU(fn, 10, (...args: unknown[]) =>
        String((args[0] as { id: number }).id)
      );

      expect(memoized({ id: 5 })).toBe(10);
      expect(memoized({ id: 5 })).toBe(10);
    });
  });

  describe('slidingWindow', () => {
    it('should generate windows', () => {
      const windows = [...slidingWindow([1, 2, 3, 4, 5], 3)];

      expect(windows).toEqual([
        [1, 2, 3],
        [2, 3, 4],
        [3, 4, 5],
      ]);
    });

    it('should handle window size equal to array', () => {
      const windows = [...slidingWindow([1, 2, 3], 3)];
      expect(windows).toEqual([[1, 2, 3]]);
    });

    it('should handle window larger than array', () => {
      const windows = [...slidingWindow([1, 2], 5)];
      expect(windows).toEqual([]);
    });

    it('should handle invalid window size', () => {
      const windows = [...slidingWindow([1, 2, 3], 0)];
      expect(windows).toEqual([]);
    });
  });

  describe('createMovingAverage', () => {
    it('should calculate moving average', () => {
      const ma = createMovingAverage(3);

      expect(ma.add(1)).toBe(1);
      expect(ma.add(2)).toBe(1.5);
      expect(ma.add(3)).toBe(2);
      expect(ma.add(4)).toBe(3); // (2+3+4)/3
    });

    it('should get current average', () => {
      const ma = createMovingAverage(3);
      ma.add(1);
      ma.add(2);

      expect(ma.getAverage()).toBe(1.5);
    });

    it('should clear', () => {
      const ma = createMovingAverage(3);
      ma.add(1);
      ma.add(2);
      ma.clear();

      expect(ma.getAverage()).toBe(0);
    });

    it('should handle empty state', () => {
      const ma = createMovingAverage(3);
      expect(ma.getAverage()).toBe(0);
    });
  });
});
