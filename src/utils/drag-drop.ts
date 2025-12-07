/**
 * Drag and Drop Utilities
 * @module utils/drag-drop
 * @description Comprehensive drag and drop utilities with support for
 * file drops, sortable lists, and custom drag behaviors.
 */

import { isBrowser } from './dom';

/**
 * Drag data item
 */
export interface DragDataItem {
  type: string;
  data: string;
}

/**
 * Drop zone options
 */
export interface DropZoneOptions {
  /** Accepted MIME types for file drops */
  accept?: string[];
  /** Allow multiple files */
  multiple?: boolean;
  /** CSS class added when dragging over */
  dragOverClass?: string;
  /** Prevent default on drag events */
  preventDefault?: boolean;
  /** File drop callback */
  onFileDrop?: (files: File[]) => void;
  /** Data drop callback */
  onDataDrop?: (data: DataTransfer) => void;
  /** Drag enter callback */
  onDragEnter?: (event: DragEvent) => void;
  /** Drag leave callback */
  onDragLeave?: (event: DragEvent) => void;
}

/**
 * Create a file drop zone
 * @param element - Element to make droppable
 * @param options - Drop zone options
 * @returns Cleanup function
 * @example
 * const dropZone = createDropZone(document.getElementById('upload'), {
 *   accept: ['image/*', 'application/pdf'],
 *   multiple: true,
 *   onFileDrop: (files) => handleFiles(files),
 * });
 */
export function createDropZone(
  element: HTMLElement,
  options: DropZoneOptions = {}
): () => void {
  const {
    accept = [],
    multiple = true,
    dragOverClass = 'drag-over',
    preventDefault = true,
    onFileDrop,
    onDataDrop,
    onDragEnter,
    onDragLeave,
  } = options;

  let dragCounter = 0;

  const isAcceptedFile = (file: File): boolean => {
    if (accept.length === 0) return true;

    return accept.some(pattern => {
      if (pattern.endsWith('/*')) {
        const type = pattern.slice(0, -2);
        return file.type.startsWith(type);
      }
      return file.type === pattern || file.name.endsWith(pattern);
    });
  };

  const handleDragEnter = (event: DragEvent): void => {
    if (preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }

    dragCounter++;

    if (dragCounter === 1) {
      element.classList.add(dragOverClass);
      onDragEnter?.(event);
    }
  };

  const handleDragLeave = (event: DragEvent): void => {
    if (preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }

    dragCounter--;

    if (dragCounter === 0) {
      element.classList.remove(dragOverClass);
      onDragLeave?.(event);
    }
  };

  const handleDragOver = (event: DragEvent): void => {
    if (preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (event: DragEvent): void => {
    if (preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }

    dragCounter = 0;
    element.classList.remove(dragOverClass);

    if (!event.dataTransfer) return;

    const files = Array.from(event.dataTransfer.files);
    const acceptedFiles = files.filter(isAcceptedFile);
    const filesToProcess = multiple ? acceptedFiles : acceptedFiles.slice(0, 1);

    if (filesToProcess.length > 0 && onFileDrop) {
      onFileDrop(filesToProcess);
    }

    if (onDataDrop) {
      onDataDrop(event.dataTransfer);
    }
  };

  element.addEventListener('dragenter', handleDragEnter);
  element.addEventListener('dragleave', handleDragLeave);
  element.addEventListener('dragover', handleDragOver);
  element.addEventListener('drop', handleDrop);

  return () => {
    element.removeEventListener('dragenter', handleDragEnter);
    element.removeEventListener('dragleave', handleDragLeave);
    element.removeEventListener('dragover', handleDragOver);
    element.removeEventListener('drop', handleDrop);
    element.classList.remove(dragOverClass);
  };
}

// ============================================================================
// Draggable Elements
// ============================================================================

/**
 * Draggable options
 */
export interface DraggableOptions {
  /** Data to transfer */
  data?: DragDataItem[];
  /** Drag effect */
  effectAllowed?: DataTransfer['effectAllowed'];
  /** Custom drag image */
  dragImage?: {
    element: HTMLElement;
    offsetX?: number;
    offsetY?: number;
  };
  /** CSS class added while dragging */
  draggingClass?: string;
  /** Drag start callback */
  onDragStart?: (event: DragEvent) => void;
  /** Drag end callback */
  onDragEnd?: (event: DragEvent) => void;
}

/**
 * Make an element draggable
 * @param element - Element to make draggable
 * @param options - Draggable options
 * @returns Cleanup function
 */
export function makeDraggable(
  element: HTMLElement,
  options: DraggableOptions = {}
): () => void {
  const {
    data = [],
    effectAllowed = 'move',
    dragImage,
    draggingClass = 'dragging',
    onDragStart,
    onDragEnd,
  } = options;

  element.draggable = true;

  const handleDragStart = (event: DragEvent): void => {
    if (!event.dataTransfer) return;

    // Set data
    for (const item of data) {
      event.dataTransfer.setData(item.type, item.data);
    }

    // Set effect
    event.dataTransfer.effectAllowed = effectAllowed;

    // Set custom drag image
    if (dragImage) {
      event.dataTransfer.setDragImage(
        dragImage.element,
        dragImage.offsetX ?? 0,
        dragImage.offsetY ?? 0
      );
    }

    element.classList.add(draggingClass);
    onDragStart?.(event);
  };

  const handleDragEnd = (event: DragEvent): void => {
    element.classList.remove(draggingClass);
    onDragEnd?.(event);
  };

  element.addEventListener('dragstart', handleDragStart);
  element.addEventListener('dragend', handleDragEnd);

  return () => {
    element.removeEventListener('dragstart', handleDragStart);
    element.removeEventListener('dragend', handleDragEnd);
    element.draggable = false;
  };
}

// ============================================================================
// Sortable Lists
// ============================================================================

/**
 * Sortable options
 */
export interface SortableOptions<T = unknown> {
  /** CSS selector for sortable items */
  itemSelector: string;
  /** CSS selector for drag handle (optional) */
  handleSelector?: string;
  /** Data attribute to identify items */
  dataAttribute?: string;
  /** CSS class for placeholder */
  placeholderClass?: string;
  /** CSS class for dragging item */
  draggingClass?: string;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Allow sorting between groups */
  group?: string;
  /** Called when order changes */
  onSort?: (items: T[], oldIndex: number, newIndex: number) => void;
  /** Get item data */
  getData?: (element: HTMLElement) => T;
}

/**
 * Sortable instance
 */
export interface SortableInstance {
  /** Get current order */
  getOrder(): string[];
  /** Set order programmatically */
  setOrder(order: string[]): void;
  /** Enable sorting */
  enable(): void;
  /** Disable sorting */
  disable(): void;
  /** Destroy instance */
  destroy(): void;
}

/**
 * Create a sortable list
 * @param container - Container element
 * @param options - Sortable options
 * @returns Sortable instance
 * @example
 * const sortable = createSortable(document.getElementById('list'), {
 *   itemSelector: '.list-item',
 *   onSort: (items, oldIndex, newIndex) => {
 *     console.log(`Moved from ${oldIndex} to ${newIndex}`);
 *   },
 * });
 */
export function createSortable<T = unknown>(
  container: HTMLElement,
  options: SortableOptions<T>
): SortableInstance {
  const {
    itemSelector,
    handleSelector,
    dataAttribute = 'data-id',
    placeholderClass = 'sortable-placeholder',
    draggingClass = 'sortable-dragging',
    animationDuration = 150,
    group,
    onSort,
    getData,
  } = options;

  let enabled = true;
  let draggingElement: HTMLElement | null = null;
  let placeholder: HTMLElement | null = null;
  let startIndex = -1;

  const getItems = (): HTMLElement[] => {
    return Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
  };

  const createPlaceholder = (source: HTMLElement): HTMLElement => {
    const ph = document.createElement('div');
    ph.className = placeholderClass;
    ph.style.height = `${source.offsetHeight}px`;
    ph.style.width = `${source.offsetWidth}px`;
    return ph;
  };

  const getInsertPosition = (y: number): HTMLElement | null => {
    const items = getItems().filter(item => item !== draggingElement);

    for (const item of items) {
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      if (y < midY) {
        return item;
      }
    }

    return null;
  };

  const animateItem = (item: HTMLElement, from: DOMRect, to: DOMRect): void => {
    const deltaX = from.left - to.left;
    const deltaY = from.top - to.top;

    if (deltaX === 0 && deltaY === 0) return;

    item.animate(
      [
        { transform: `translate(${deltaX}px, ${deltaY}px)` },
        { transform: 'translate(0, 0)' },
      ],
      {
        duration: animationDuration,
        easing: 'ease-out',
      }
    );
  };

  const handleDragStart = (event: DragEvent): void => {
    if (!enabled) return;

    const target = event.target as HTMLElement;
    const item = target.closest<HTMLElement>(itemSelector);

    if (!item || !container.contains(item)) return;

    // Check handle
    if (handleSelector) {
      const handle = item.querySelector(handleSelector);
      if (!handle?.contains(target)) return;
    }

    draggingElement = item;
    startIndex = getItems().indexOf(item);

    // Create placeholder
    placeholder = createPlaceholder(item);

    // Set drag data
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      if (group) {
        event.dataTransfer.setData('sortable-group', group);
      }
    }

    // Add classes after a frame to not affect drag image
    requestAnimationFrame(() => {
      if (draggingElement) {
        draggingElement.classList.add(draggingClass);
        container.insertBefore(placeholder!, draggingElement.nextSibling);
        draggingElement.style.display = 'none';
      }
    });
  };

  const handleDragOver = (event: DragEvent): void => {
    if (!enabled || !draggingElement || !placeholder) return;

    event.preventDefault();

    const insertBefore = getInsertPosition(event.clientY);
    const oldPositions = new Map<HTMLElement, DOMRect>();

    // Store positions
    getItems().forEach(item => {
      oldPositions.set(item, item.getBoundingClientRect());
    });

    // Move placeholder
    if (insertBefore) {
      container.insertBefore(placeholder, insertBefore);
    } else {
      container.appendChild(placeholder);
    }

    // Animate items
    getItems().forEach(item => {
      const oldRect = oldPositions.get(item);
      if (oldRect) {
        animateItem(item, oldRect, item.getBoundingClientRect());
      }
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDragEnd = (event: DragEvent): void => {
    if (!draggingElement || !placeholder) return;

    // Insert element at placeholder position
    container.insertBefore(draggingElement, placeholder);

    // Clean up
    draggingElement.classList.remove(draggingClass);
    draggingElement.style.display = '';
    placeholder.remove();

    const newIndex = getItems().indexOf(draggingElement);

    if (newIndex !== startIndex && onSort) {
      const items = getItems().map(item =>
        getData
          ? getData(item)
          : (item.getAttribute(dataAttribute) as unknown as T)
      );
      onSort(items, startIndex, newIndex);
    }

    draggingElement = null;
    placeholder = null;
    startIndex = -1;
  };

  const handleDrop = (event: DragEvent): void => {
    event.preventDefault();
  };

  // Set up event listeners
  container.addEventListener('dragstart', handleDragStart);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('dragend', handleDragEnd);
  container.addEventListener('drop', handleDrop);

  return {
    getOrder(): string[] {
      return getItems().map(item => item.getAttribute(dataAttribute) || '');
    },

    setOrder(order: string[]): void {
      const items = getItems();
      const itemMap = new Map<string, HTMLElement>();

      items.forEach(item => {
        const id = item.getAttribute(dataAttribute);
        if (id) itemMap.set(id, item);
      });

      order.forEach(id => {
        const item = itemMap.get(id);
        if (item) container.appendChild(item);
      });
    },

    enable(): void {
      enabled = true;
    },

    disable(): void {
      enabled = false;
    },

    destroy(): void {
      container.removeEventListener('dragstart', handleDragStart);
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('dragend', handleDragEnd);
      container.removeEventListener('drop', handleDrop);
    },
  };
}

// ============================================================================
// File Drop Utilities
// ============================================================================

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  file: File;
  errors: string[];
}

/**
 * File validation options
 */
export interface FileValidationOptions {
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Minimum file size in bytes */
  minSize?: number;
  /** Allowed MIME types */
  allowedTypes?: string[];
  /** Allowed extensions */
  allowedExtensions?: string[];
  /** Custom validator */
  validate?: (file: File) => string | null;
}

/**
 * Validate dropped files
 * @param files - Files to validate
 * @param options - Validation options
 * @returns Validation results
 */
export function validateFiles(
  files: File[],
  options: FileValidationOptions = {}
): FileValidationResult[] {
  const {
    maxSize,
    minSize,
    allowedTypes = [],
    allowedExtensions = [],
    validate,
  } = options;

  return files.map(file => {
    const errors: string[] = [];

    // Check size
    if (maxSize && file.size > maxSize) {
      errors.push(`File too large. Maximum size: ${formatFileSize(maxSize)}`);
    }

    if (minSize && file.size < minSize) {
      errors.push(`File too small. Minimum size: ${formatFileSize(minSize)}`);
    }

    // Check type
    if (allowedTypes.length > 0) {
      const typeMatch = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -2));
        }
        return file.type === type;
      });

      if (!typeMatch) {
        errors.push(`Invalid file type: ${file.type || 'unknown'}`);
      }
    }

    // Check extension
    if (allowedExtensions.length > 0) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowedExtensions.includes(`.${ext}`)) {
        errors.push(`Invalid file extension: .${ext || 'none'}`);
      }
    }

    // Custom validation
    if (validate) {
      const customError = validate(file);
      if (customError) {
        errors.push(customError);
      }
    }

    return {
      valid: errors.length === 0,
      file,
      errors,
    };
  });
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Read file as data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Read file as text
 */
export function readFileAsText(
  file: File,
  encoding = 'utf-8'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, encoding);
  });
}

/**
 * Read file as array buffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// ============================================================================
// Touch-Friendly Drag
// ============================================================================

/**
 * Touch drag options
 */
export interface TouchDragOptions {
  /** Callback when dragging starts */
  onStart?: (x: number, y: number) => void;
  /** Callback during drag */
  onMove?: (x: number, y: number, deltaX: number, deltaY: number) => void;
  /** Callback when dragging ends */
  onEnd?: (x: number, y: number) => void;
  /** Minimum distance to start drag */
  threshold?: number;
}

/**
 * Create touch-friendly drag handler
 * Works with both mouse and touch events
 */
export function createTouchDrag(
  element: HTMLElement,
  options: TouchDragOptions = {}
): () => void {
  const { onStart, onMove, onEnd, threshold = 5 } = options;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let hasMoved = false;

  const getCoords = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleStart = (e: MouseEvent | TouchEvent): void => {
    const coords = getCoords(e);
    startX = coords.x;
    startY = coords.y;
    currentX = startX;
    currentY = startY;
    isDragging = true;
    hasMoved = false;
  };

  const handleMove = (e: MouseEvent | TouchEvent): void => {
    if (!isDragging) return;

    const coords = getCoords(e);
    const deltaX = coords.x - currentX;
    const deltaY = coords.y - currentY;

    currentX = coords.x;
    currentY = coords.y;

    const totalDelta = Math.sqrt(
      Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)
    );

    if (!hasMoved && totalDelta >= threshold) {
      hasMoved = true;
      onStart?.(startX, startY);
    }

    if (hasMoved) {
      e.preventDefault();
      onMove?.(currentX, currentY, deltaX, deltaY);
    }
  };

  const handleEnd = (): void => {
    if (isDragging && hasMoved) {
      onEnd?.(currentX, currentY);
    }
    isDragging = false;
    hasMoved = false;
  };

  // Mouse events
  element.addEventListener('mousedown', handleStart);
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleEnd);

  // Touch events
  element.addEventListener('touchstart', handleStart, { passive: true });
  document.addEventListener('touchmove', handleMove, { passive: false });
  document.addEventListener('touchend', handleEnd);

  return () => {
    element.removeEventListener('mousedown', handleStart);
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleEnd);
    element.removeEventListener('touchstart', handleStart);
    document.removeEventListener('touchmove', handleMove);
    document.removeEventListener('touchend', handleEnd);
  };
}

/**
 * Check if drag and drop is supported
 */
export function isDragDropSupported(): boolean {
  if (!isBrowser()) return false;

  const div = document.createElement('div');
  return 'draggable' in div || ('ondragstart' in div && 'ondrop' in div);
}

/**
 * Check if file drag and drop is supported
 */
export function isFileDragSupported(): boolean {
  if (!isBrowser()) return false;

  return 'FileReader' in window && 'DataTransfer' in window;
}
