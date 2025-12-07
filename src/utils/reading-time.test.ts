import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from './reading-time';

describe('Reading Time', () => {
  it('should calculate reading time for empty text', () => {
    const result = calculateReadingTime('');
    expect(result).toEqual({
      text: '0 min read',
      minutes: 0,
      time: 0,
      words: 0,
    });
  });

  it('should calculate reading time for short text', () => {
    const text = 'This is a short text with a few words.';
    const result = calculateReadingTime(text);
    expect(result.words).toBe(9);
    expect(result.minutes).toBe(1); // Minimum 1 minute
    expect(result.text).toBe('1 min read');
  });

  it('should calculate reading time for long text', () => {
    // 200 words = 1 minute
    const text = Array(200).fill('word').join(' ');
    const result = calculateReadingTime(text);
    expect(result.words).toBe(200);
    expect(result.minutes).toBe(1);
    expect(result.text).toBe('1 min read');
  });

  it('should calculate reading time for very long text', () => {
    // 400 words = 2 minutes
    const text = Array(401).fill('word').join(' ');
    const result = calculateReadingTime(text);
    expect(result.words).toBe(401);
    expect(result.minutes).toBe(3); // 2.005 -> ceil -> 3
    expect(result.text).toBe('3 min read');
  });

  it('should respect wordsPerMinute option', () => {
    const text = Array(200).fill('word').join(' ');
    const result = calculateReadingTime(text, { wordsPerMinute: 100 });
    expect(result.minutes).toBe(2);
    expect(result.text).toBe('2 min read');
  });

  it('should include seconds if requested', () => {
    const text = Array(50).fill('word').join(' '); // 0.25 minutes = 15 seconds
    const result = calculateReadingTime(text, { includeSeconds: true });
    expect(result.text).toBe('15 sec read');
  });

  it('should ignore HTML tags', () => {
    const text = '<p>This is <b>bold</b> text.</p>';
    const result = calculateReadingTime(text);
    expect(result.words).toBe(4);
  });
});
