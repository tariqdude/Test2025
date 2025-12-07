import { describe, it, expect } from 'vitest';
import { isBrowser, $, $$, byId, createElement } from './dom';

describe('DOM Utilities', () => {
  describe('isBrowser', () => {
    it('should return true in jsdom environment', () => {
      expect(isBrowser()).toBe(true);
    });
  });

  describe('$', () => {
    it('should query selector', () => {
      document.body.innerHTML = '<div class="test">Hello</div>';
      const el = $('.test');
      expect(el).not.toBeNull();
      expect(el?.textContent).toBe('Hello');
    });

    it('should return null if not found', () => {
      document.body.innerHTML = '';
      expect($('.test')).toBeNull();
    });
  });

  describe('$$', () => {
    it('should query selector all', () => {
      document.body.innerHTML =
        '<ul><li class="item">1</li><li class="item">2</li></ul>';
      const els = $$('.item');
      expect(els).toHaveLength(2);
      expect(els[0].textContent).toBe('1');
    });

    it('should return empty array if not found', () => {
      document.body.innerHTML = '';
      expect($$('.item')).toEqual([]);
    });
  });

  describe('byId', () => {
    it('should get element by id', () => {
      document.body.innerHTML = '<div id="test">Hello</div>';
      const el = byId('test');
      expect(el).not.toBeNull();
      expect(el?.textContent).toBe('Hello');
    });

    it('should return null if not found', () => {
      document.body.innerHTML = '';
      expect(byId('test')).toBeNull();
    });
  });

  describe('createElement', () => {
    it('should create element with attributes', () => {
      const el = createElement('div', {
        attributes: { id: 'test', 'data-val': '1' },
      });
      expect(el.tagName).toBe('DIV');
      expect(el.id).toBe('test');
      expect(el.getAttribute('data-val')).toBe('1');
    });

    it('should create element with classes', () => {
      const el = createElement('div', {
        classes: ['a', 'b'],
      });
      expect(el.classList.contains('a')).toBe(true);
      expect(el.classList.contains('b')).toBe(true);
    });

    it('should create element with styles', () => {
      const el = createElement('div', {
        styles: { color: 'red', display: 'none' },
      });
      expect(el.style.color).toBe('red');
      expect(el.style.display).toBe('none');
    });

    it('should create element with text', () => {
      const el = createElement('div', { text: 'Hello' });
      expect(el.textContent).toBe('Hello');
    });

    it('should create element with html', () => {
      const el = createElement('div', { html: '<span>Hello</span>' });
      expect(el.innerHTML).toBe('<span>Hello</span>');
    });

    it('should create element with children', () => {
      const child = document.createElement('span');
      const el = createElement('div', {
        children: [child, 'text'],
      });
      expect(el.children[0]).toBe(child);
      expect(el.childNodes[1].textContent).toBe('text');
    });
  });
});
