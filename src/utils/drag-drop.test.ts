/**
 * Tests for drag and drop utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDropZone,
  makeDraggable,
  createSortable,
  validateFiles,
  readFileAsDataURL,
  readFileAsText,
  readFileAsArrayBuffer,
  createTouchDrag,
  isDragDropSupported,
  isFileDragSupported,
} from './drag-drop';

// Polyfill DataTransfer for jsdom
class MockDataTransfer implements DataTransfer {
  private data: Map<string, string> = new Map();
  private fileList: File[] = [];
  dropEffect: DataTransfer['dropEffect'] = 'none';
  effectAllowed: DataTransfer['effectAllowed'] = 'uninitialized';

  get files(): FileList {
    const list = this.fileList as unknown as FileList;
    (list as unknown as { length: number }).length = this.fileList.length;
    (list as unknown as { item: (i: number) => File | null }).item = (
      i: number
    ) => this.fileList[i] || null;
    return list;
  }

  get items(): DataTransferItemList {
    const items = this.fileList.map(f => ({
      kind: 'file' as const,
      type: f.type,
      getAsFile: () => f,
      getAsString: () => {},
      webkitGetAsEntry: () => null,
    }));
    return {
      length: items.length,
      add: (data: File | string, type?: string) => {
        if (data instanceof File) {
          this.fileList.push(data);
        } else if (type) {
          this.data.set(type, data);
        }
        return null;
      },
      clear: () => {
        this.fileList = [];
        this.data.clear();
      },
      remove: (index: number) => {
        this.fileList.splice(index, 1);
      },
      [Symbol.iterator]: () => items[Symbol.iterator](),
    } as unknown as DataTransferItemList;
  }

  get types(): readonly string[] {
    return Array.from(this.data.keys());
  }

  clearData(type?: string): void {
    if (type) this.data.delete(type);
    else this.data.clear();
  }

  getData(type: string): string {
    return this.data.get(type) || '';
  }

  setData(type: string, data: string): void {
    this.data.set(type, data);
  }

  setDragImage(_img: Element, _xOffset: number, _yOffset: number): void {}
}

// Polyfill DragEvent for jsdom
class MockDragEvent extends MouseEvent {
  readonly dataTransfer: DataTransfer | null;

  constructor(type: string, eventInit?: DragEventInit) {
    super(type, eventInit);
    this.dataTransfer = eventInit?.dataTransfer || null;
  }
}

// Set up global polyfills
if (typeof globalThis.DataTransfer === 'undefined') {
  (
    globalThis as unknown as { DataTransfer: typeof MockDataTransfer }
  ).DataTransfer = MockDataTransfer;
}
if (typeof globalThis.DragEvent === 'undefined') {
  (globalThis as unknown as { DragEvent: typeof MockDragEvent }).DragEvent =
    MockDragEvent;
}

describe('drag-drop utilities', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  describe('createDropZone', () => {
    it('should create drop zone and return cleanup', () => {
      const cleanup = createDropZone(element);

      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should add drag-over class on drag enter', () => {
      createDropZone(element, { dragOverClass: 'drag-over' });

      const event = new Event('dragenter', { bubbles: true });
      element.dispatchEvent(event);

      expect(element.classList.contains('drag-over')).toBe(true);
    });

    it('should remove drag-over class on drag leave', () => {
      createDropZone(element, { dragOverClass: 'drag-over' });

      element.dispatchEvent(new Event('dragenter', { bubbles: true }));
      element.dispatchEvent(new Event('dragleave', { bubbles: true }));

      expect(element.classList.contains('drag-over')).toBe(false);
    });

    it('should call onFileDrop with files', () => {
      const onFileDrop = vi.fn();
      createDropZone(element, { onFileDrop });

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const event = new DragEvent('drop', {
        bubbles: true,
        dataTransfer,
      });

      element.dispatchEvent(event);

      expect(onFileDrop).toHaveBeenCalled();
    });

    it('should filter files by accept types', () => {
      const onFileDrop = vi.fn();
      createDropZone(element, {
        accept: ['image/*'],
        onFileDrop,
      });

      const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const imgFile = new File(['content'], 'test.png', { type: 'image/png' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(txtFile);
      dataTransfer.items.add(imgFile);

      const event = new DragEvent('drop', {
        bubbles: true,
        dataTransfer,
      });

      element.dispatchEvent(event);

      expect(onFileDrop).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ type: 'image/png' })])
      );
    });

    it('should call onDragEnter callback', () => {
      const onDragEnter = vi.fn();
      createDropZone(element, { onDragEnter });

      element.dispatchEvent(new Event('dragenter', { bubbles: true }));

      expect(onDragEnter).toHaveBeenCalled();
    });

    it('should call onDragLeave callback', () => {
      const onDragLeave = vi.fn();
      createDropZone(element, { onDragLeave });

      element.dispatchEvent(new Event('dragenter', { bubbles: true }));
      element.dispatchEvent(new Event('dragleave', { bubbles: true }));

      expect(onDragLeave).toHaveBeenCalled();
    });
  });

  describe('makeDraggable', () => {
    it('should make element draggable', () => {
      makeDraggable(element);

      expect(element.draggable).toBe(true);
    });

    it('should return cleanup function', () => {
      const cleanup = makeDraggable(element);

      expect(typeof cleanup).toBe('function');
    });

    it('should set draggable to false on cleanup', () => {
      const cleanup = makeDraggable(element);
      cleanup();

      expect(element.draggable).toBe(false);
    });

    it('should add dragging class on drag start', () => {
      makeDraggable(element, { draggingClass: 'dragging' });

      const dataTransfer = new DataTransfer();
      const event = new DragEvent('dragstart', {
        bubbles: true,
        dataTransfer,
      });

      element.dispatchEvent(event);

      expect(element.classList.contains('dragging')).toBe(true);
    });

    it('should remove dragging class on drag end', () => {
      makeDraggable(element, { draggingClass: 'dragging' });

      const dataTransfer = new DataTransfer();
      element.dispatchEvent(
        new DragEvent('dragstart', { bubbles: true, dataTransfer })
      );
      element.dispatchEvent(new DragEvent('dragend', { bubbles: true }));

      expect(element.classList.contains('dragging')).toBe(false);
    });

    it('should call onDragStart callback', () => {
      const onDragStart = vi.fn();
      makeDraggable(element, { onDragStart });

      const dataTransfer = new DataTransfer();
      element.dispatchEvent(
        new DragEvent('dragstart', { bubbles: true, dataTransfer })
      );

      expect(onDragStart).toHaveBeenCalled();
    });

    it('should call onDragEnd callback', () => {
      const onDragEnd = vi.fn();
      makeDraggable(element, { onDragEnd });

      element.dispatchEvent(new DragEvent('dragend', { bubbles: true }));

      expect(onDragEnd).toHaveBeenCalled();
    });
  });

  describe('createSortable', () => {
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.innerHTML = `
        <div class="item" data-id="1">Item 1</div>
        <div class="item" data-id="2">Item 2</div>
        <div class="item" data-id="3">Item 3</div>
      `;
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    it('should create sortable instance', () => {
      const sortable = createSortable(container, {
        itemSelector: '.item',
      });

      expect(sortable).toBeDefined();
      expect(typeof sortable.getOrder).toBe('function');
      expect(typeof sortable.setOrder).toBe('function');
      expect(typeof sortable.destroy).toBe('function');
    });

    it('should get order of items', () => {
      const sortable = createSortable(container, {
        itemSelector: '.item',
      });

      const order = sortable.getOrder();

      expect(order).toEqual(['1', '2', '3']);
    });

    it('should set order of items', () => {
      const sortable = createSortable(container, {
        itemSelector: '.item',
      });

      sortable.setOrder(['3', '1', '2']);

      const order = sortable.getOrder();
      expect(order).toEqual(['3', '1', '2']);
    });

    it('should enable and disable', () => {
      const sortable = createSortable(container, {
        itemSelector: '.item',
      });

      sortable.disable();
      sortable.enable();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('validateFiles', () => {
    it('should validate files', () => {
      const files = [new File(['content'], 'test.txt', { type: 'text/plain' })];

      const results = validateFiles(files);

      expect(results).toHaveLength(1);
      expect(results[0].valid).toBe(true);
      expect(results[0].errors).toHaveLength(0);
    });

    it('should reject files over max size', () => {
      const files = [
        new File(['x'.repeat(1000)], 'large.txt', { type: 'text/plain' }),
      ];

      const results = validateFiles(files, { maxSize: 100 });

      expect(results[0].valid).toBe(false);
      expect(
        results[0].errors.some(e => e.toLowerCase().includes('too large'))
      ).toBe(true);
    });

    it('should reject files under min size', () => {
      const files = [new File(['x'], 'small.txt', { type: 'text/plain' })];

      const results = validateFiles(files, { minSize: 100 });

      expect(results[0].valid).toBe(false);
      expect(
        results[0].errors.some(e => e.toLowerCase().includes('too small'))
      ).toBe(true);
    });

    it('should reject files with wrong type', () => {
      const files = [new File(['content'], 'test.txt', { type: 'text/plain' })];

      const results = validateFiles(files, { allowedTypes: ['image/*'] });

      expect(results[0].valid).toBe(false);
      expect(results[0].errors.some(e => e.includes('Invalid file type'))).toBe(
        true
      );
    });

    it('should reject files with wrong extension', () => {
      const files = [new File(['content'], 'test.txt', { type: 'text/plain' })];

      const results = validateFiles(files, {
        allowedExtensions: ['.jpg', '.png'],
      });

      expect(results[0].valid).toBe(false);
      expect(
        results[0].errors.some(e => e.includes('Invalid file extension'))
      ).toBe(true);
    });

    it('should run custom validator', () => {
      const files = [new File(['content'], 'test.txt', { type: 'text/plain' })];

      const results = validateFiles(files, {
        validate: file =>
          file.name.includes('test') ? 'No test files!' : null,
      });

      expect(results[0].valid).toBe(false);
      expect(results[0].errors).toContain('No test files!');
    });
  });

  describe('file readers', () => {
    it('should read file as data URL', async () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' });

      const result = await readFileAsDataURL(file);

      expect(result).toContain('data:');
    });

    it('should read file as text', async () => {
      const file = new File(['hello world'], 'test.txt', {
        type: 'text/plain',
      });

      const result = await readFileAsText(file);

      expect(result).toBe('hello world');
    });

    it('should read file as array buffer', async () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' });

      const result = await readFileAsArrayBuffer(file);

      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('createTouchDrag', () => {
    it('should create touch drag handler', () => {
      const cleanup = createTouchDrag(element);

      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should call onStart when drag starts', () => {
      const onStart = vi.fn();
      const onMove = vi.fn();

      createTouchDrag(element, { onStart, onMove, threshold: 0 });

      // Simulate mouse down and move
      element.dispatchEvent(
        new MouseEvent('mousedown', { clientX: 0, clientY: 0, bubbles: true })
      );
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 10, clientY: 10, bubbles: true })
      );

      expect(onStart).toHaveBeenCalled();
    });

    it('should call onEnd when drag ends', () => {
      const onEnd = vi.fn();

      createTouchDrag(element, { onEnd, threshold: 0 });

      element.dispatchEvent(
        new MouseEvent('mousedown', { clientX: 0, clientY: 0, bubbles: true })
      );
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 10, clientY: 10, bubbles: true })
      );
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

      expect(onEnd).toHaveBeenCalled();
    });
  });

  describe('feature detection', () => {
    it('should detect drag and drop support', () => {
      expect(typeof isDragDropSupported()).toBe('boolean');
    });

    it('should detect file drag support', () => {
      expect(typeof isFileDragSupported()).toBe('boolean');
    });
  });
});
