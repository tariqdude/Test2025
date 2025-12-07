/**
 * Canvas and Graphics Utilities
 * @module utils/canvas
 * @description High-level canvas drawing helpers, image manipulation,
 * and graphics primitives for 2D rendering.
 */

import { isBrowser } from './dom';

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangle
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Color formats
 */
export type Color = string | CanvasGradient | CanvasPattern;

/**
 * Drawing context options
 */
export interface DrawingContextOptions {
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Scale for high-DPI displays */
  scale?: number;
  /** Background color */
  backgroundColor?: string;
}

/**
 * Drawing context with helper methods
 */
export interface DrawingContext {
  /** Raw canvas element */
  canvas: HTMLCanvasElement;
  /** Raw 2D context */
  ctx: CanvasRenderingContext2D;
  /** Clear the canvas */
  clear(): void;
  /** Fill background */
  fillBackground(color: Color): void;
  /** Draw rounded rectangle */
  roundedRect(rect: Rect, radius: number, options?: ShapeOptions): void;
  /** Draw circle */
  circle(center: Point, radius: number, options?: ShapeOptions): void;
  /** Draw ellipse */
  ellipse(
    center: Point,
    radiusX: number,
    radiusY: number,
    options?: ShapeOptions
  ): void;
  /** Draw line */
  line(from: Point, to: Point, options?: LineOptions): void;
  /** Draw polyline */
  polyline(points: Point[], options?: LineOptions): void;
  /** Draw polygon */
  polygon(points: Point[], options?: ShapeOptions): void;
  /** Draw arrow */
  arrow(from: Point, to: Point, options?: ArrowOptions): void;
  /** Draw arc */
  arc(
    center: Point,
    radius: number,
    startAngle: number,
    endAngle: number,
    options?: LineOptions
  ): void;
  /** Draw bezier curve */
  bezier(
    start: Point,
    cp1: Point,
    cp2: Point,
    end: Point,
    options?: LineOptions
  ): void;
  /** Draw quadratic curve */
  quadratic(start: Point, cp: Point, end: Point, options?: LineOptions): void;
  /** Draw text */
  text(text: string, position: Point, options?: TextOptions): void;
  /** Draw image */
  image(
    img: CanvasImageSource,
    position: Point,
    options?: ImageDrawOptions
  ): void;
  /** Create linear gradient */
  linearGradient(
    start: Point,
    end: Point,
    stops: Array<{ offset: number; color: string }>
  ): CanvasGradient;
  /** Create radial gradient */
  radialGradient(
    center: Point,
    innerRadius: number,
    outerRadius: number,
    stops: Array<{ offset: number; color: string }>
  ): CanvasGradient;
  /** Save state */
  save(): void;
  /** Restore state */
  restore(): void;
  /** Translate */
  translate(x: number, y: number): void;
  /** Rotate */
  rotate(angle: number): void;
  /** Scale */
  scale(x: number, y?: number): void;
  /** Export to data URL */
  toDataURL(type?: string, quality?: number): string;
  /** Export to blob */
  toBlob(type?: string, quality?: number): Promise<Blob>;
  /** Resize canvas */
  resize(width: number, height: number): void;
}

/**
 * Shape options
 */
export interface ShapeOptions {
  fill?: Color;
  stroke?: Color;
  lineWidth?: number;
  lineDash?: number[];
  shadow?: ShadowOptions;
}

/**
 * Line options
 */
export interface LineOptions {
  stroke?: Color;
  lineWidth?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  lineDash?: number[];
}

/**
 * Arrow options
 */
export interface ArrowOptions extends LineOptions {
  headLength?: number;
  headAngle?: number;
  doubleHeaded?: boolean;
}

/**
 * Text options
 */
export interface TextOptions {
  fill?: Color;
  stroke?: Color;
  font?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  maxWidth?: number;
  lineHeight?: number;
}

/**
 * Shadow options
 */
export interface ShadowOptions {
  color?: string;
  blur?: number;
  offsetX?: number;
  offsetY?: number;
}

/**
 * Image draw options
 */
export interface ImageDrawOptions {
  width?: number;
  height?: number;
  sourceRect?: Rect;
  opacity?: number;
}

/**
 * Create a drawing context with helper methods
 * @param canvas - Canvas element or selector
 * @param options - Context options
 * @returns Drawing context
 * @example
 * const ctx = createDrawingContext('#myCanvas', { width: 800, height: 600 });
 * ctx.circle({ x: 400, y: 300 }, 50, { fill: 'red' });
 */
export function createDrawingContext(
  canvas: HTMLCanvasElement | string,
  options: DrawingContextOptions = {}
): DrawingContext {
  const {
    width,
    height,
    scale = window.devicePixelRatio || 1,
    backgroundColor,
  } = options;

  const canvasEl =
    typeof canvas === 'string'
      ? document.querySelector<HTMLCanvasElement>(canvas)!
      : canvas;

  if (!canvasEl) {
    throw new Error('Canvas element not found');
  }

  const ctx = canvasEl.getContext('2d')!;

  // Set dimensions
  if (width !== undefined) canvasEl.width = width * scale;
  if (height !== undefined) canvasEl.height = height * scale;

  // Scale for high-DPI
  if (scale !== 1) {
    canvasEl.style.width = `${canvasEl.width / scale}px`;
    canvasEl.style.height = `${canvasEl.height / scale}px`;
    ctx.scale(scale, scale);
  }

  // Fill background
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasEl.width / scale, canvasEl.height / scale);
  }

  const applyShapeOptions = (options: ShapeOptions = {}): void => {
    if (options.shadow) {
      ctx.shadowColor = options.shadow.color || 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = options.shadow.blur || 0;
      ctx.shadowOffsetX = options.shadow.offsetX || 0;
      ctx.shadowOffsetY = options.shadow.offsetY || 0;
    }

    if (options.lineDash) {
      ctx.setLineDash(options.lineDash);
    }
  };

  const clearShadow = (): void => {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  const drawContext: DrawingContext = {
    canvas: canvasEl,
    ctx,

    clear(): void {
      ctx.clearRect(0, 0, canvasEl.width / scale, canvasEl.height / scale);
    },

    fillBackground(color: Color): void {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvasEl.width / scale, canvasEl.height / scale);
    },

    roundedRect(rect: Rect, radius: number, options: ShapeOptions = {}): void {
      const { x, y, width: w, height: h } = rect;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.arcTo(x + w, y, x + w, y + radius, radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
      ctx.lineTo(x + radius, y + h);
      ctx.arcTo(x, y + h, x, y + h - radius, radius);
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.closePath();

      applyShapeOptions(options);

      if (options.fill) {
        ctx.fillStyle = options.fill;
        ctx.fill();
      }
      if (options.stroke) {
        ctx.strokeStyle = options.stroke;
        ctx.lineWidth = options.lineWidth || 1;
        ctx.stroke();
      }

      clearShadow();
      ctx.setLineDash([]);
    },

    circle(center: Point, radius: number, options: ShapeOptions = {}): void {
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

      applyShapeOptions(options);

      if (options.fill) {
        ctx.fillStyle = options.fill;
        ctx.fill();
      }
      if (options.stroke) {
        ctx.strokeStyle = options.stroke;
        ctx.lineWidth = options.lineWidth || 1;
        ctx.stroke();
      }

      clearShadow();
      ctx.setLineDash([]);
    },

    ellipse(
      center: Point,
      radiusX: number,
      radiusY: number,
      options: ShapeOptions = {}
    ): void {
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, radiusX, radiusY, 0, 0, Math.PI * 2);

      applyShapeOptions(options);

      if (options.fill) {
        ctx.fillStyle = options.fill;
        ctx.fill();
      }
      if (options.stroke) {
        ctx.strokeStyle = options.stroke;
        ctx.lineWidth = options.lineWidth || 1;
        ctx.stroke();
      }

      clearShadow();
      ctx.setLineDash([]);
    },

    line(from: Point, to: Point, options: LineOptions = {}): void {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);

      ctx.strokeStyle = options.stroke || '#000';
      ctx.lineWidth = options.lineWidth || 1;
      ctx.lineCap = options.lineCap || 'butt';
      ctx.lineJoin = options.lineJoin || 'miter';

      if (options.lineDash) {
        ctx.setLineDash(options.lineDash);
      }

      ctx.stroke();
      ctx.setLineDash([]);
    },

    polyline(points: Point[], options: LineOptions = {}): void {
      if (points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      ctx.strokeStyle = options.stroke || '#000';
      ctx.lineWidth = options.lineWidth || 1;
      ctx.lineCap = options.lineCap || 'butt';
      ctx.lineJoin = options.lineJoin || 'miter';

      if (options.lineDash) {
        ctx.setLineDash(options.lineDash);
      }

      ctx.stroke();
      ctx.setLineDash([]);
    },

    polygon(points: Point[], options: ShapeOptions = {}): void {
      if (points.length < 3) return;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      ctx.closePath();

      applyShapeOptions(options);

      if (options.fill) {
        ctx.fillStyle = options.fill;
        ctx.fill();
      }
      if (options.stroke) {
        ctx.strokeStyle = options.stroke;
        ctx.lineWidth = options.lineWidth || 1;
        ctx.stroke();
      }

      clearShadow();
      ctx.setLineDash([]);
    },

    arrow(from: Point, to: Point, options: ArrowOptions = {}): void {
      const {
        headLength = 10,
        headAngle = Math.PI / 6,
        doubleHeaded = false,
      } = options;

      const angle = Math.atan2(to.y - from.y, to.x - from.x);

      // Draw line
      this.line(from, to, options);

      // Draw arrowhead at end
      const drawHead = (point: Point, pointAngle: number): void => {
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(
          point.x - headLength * Math.cos(pointAngle - headAngle),
          point.y - headLength * Math.sin(pointAngle - headAngle)
        );
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(
          point.x - headLength * Math.cos(pointAngle + headAngle),
          point.y - headLength * Math.sin(pointAngle + headAngle)
        );
        ctx.strokeStyle = options.stroke || '#000';
        ctx.lineWidth = options.lineWidth || 1;
        ctx.stroke();
      };

      drawHead(to, angle);

      if (doubleHeaded) {
        drawHead(from, angle + Math.PI);
      }
    },

    arc(
      center: Point,
      radius: number,
      startAngle: number,
      endAngle: number,
      options: LineOptions = {}
    ): void {
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, startAngle, endAngle);

      ctx.strokeStyle = options.stroke || '#000';
      ctx.lineWidth = options.lineWidth || 1;
      ctx.lineCap = options.lineCap || 'butt';

      if (options.lineDash) {
        ctx.setLineDash(options.lineDash);
      }

      ctx.stroke();
      ctx.setLineDash([]);
    },

    bezier(
      start: Point,
      cp1: Point,
      cp2: Point,
      end: Point,
      options: LineOptions = {}
    ): void {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);

      ctx.strokeStyle = options.stroke || '#000';
      ctx.lineWidth = options.lineWidth || 1;

      if (options.lineDash) {
        ctx.setLineDash(options.lineDash);
      }

      ctx.stroke();
      ctx.setLineDash([]);
    },

    quadratic(
      start: Point,
      cp: Point,
      end: Point,
      options: LineOptions = {}
    ): void {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(cp.x, cp.y, end.x, end.y);

      ctx.strokeStyle = options.stroke || '#000';
      ctx.lineWidth = options.lineWidth || 1;

      if (options.lineDash) {
        ctx.setLineDash(options.lineDash);
      }

      ctx.stroke();
      ctx.setLineDash([]);
    },

    text(text: string, position: Point, options: TextOptions = {}): void {
      const {
        fill,
        stroke,
        font,
        fontSize = 16,
        fontFamily = 'sans-serif',
        fontWeight = 'normal',
        textAlign = 'left',
        textBaseline = 'alphabetic',
        maxWidth,
        lineHeight,
      } = options;

      ctx.font = font || `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = textAlign;
      ctx.textBaseline = textBaseline;

      // Handle multiline text
      if (lineHeight) {
        const lines = text.split('\n');
        lines.forEach((line, i) => {
          const y = position.y + i * lineHeight;
          if (fill) {
            ctx.fillStyle = fill;
            ctx.fillText(line, position.x, y, maxWidth);
          }
          if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.strokeText(line, position.x, y, maxWidth);
          }
        });
      } else {
        if (fill) {
          ctx.fillStyle = fill;
          ctx.fillText(text, position.x, position.y, maxWidth);
        }
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.strokeText(text, position.x, position.y, maxWidth);
        }
      }
    },

    image(
      img: CanvasImageSource,
      position: Point,
      options: ImageDrawOptions = {}
    ): void {
      const { width, height, sourceRect, opacity } = options;

      if (opacity !== undefined) {
        ctx.globalAlpha = opacity;
      }

      if (sourceRect) {
        ctx.drawImage(
          img,
          sourceRect.x,
          sourceRect.y,
          sourceRect.width,
          sourceRect.height,
          position.x,
          position.y,
          width || sourceRect.width,
          height || sourceRect.height
        );
      } else if (width !== undefined && height !== undefined) {
        ctx.drawImage(img, position.x, position.y, width, height);
      } else {
        ctx.drawImage(img, position.x, position.y);
      }

      if (opacity !== undefined) {
        ctx.globalAlpha = 1;
      }
    },

    linearGradient(
      start: Point,
      end: Point,
      stops: Array<{ offset: number; color: string }>
    ): CanvasGradient {
      const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
      for (const stop of stops) {
        gradient.addColorStop(stop.offset, stop.color);
      }
      return gradient;
    },

    radialGradient(
      center: Point,
      innerRadius: number,
      outerRadius: number,
      stops: Array<{ offset: number; color: string }>
    ): CanvasGradient {
      const gradient = ctx.createRadialGradient(
        center.x,
        center.y,
        innerRadius,
        center.x,
        center.y,
        outerRadius
      );
      for (const stop of stops) {
        gradient.addColorStop(stop.offset, stop.color);
      }
      return gradient;
    },

    save(): void {
      ctx.save();
    },

    restore(): void {
      ctx.restore();
    },

    translate(x: number, y: number): void {
      ctx.translate(x, y);
    },

    rotate(angle: number): void {
      ctx.rotate(angle);
    },

    scale(x: number, y?: number): void {
      ctx.scale(x, y ?? x);
    },

    toDataURL(type = 'image/png', quality?: number): string {
      return canvasEl.toDataURL(type, quality);
    },

    async toBlob(type = 'image/png', quality?: number): Promise<Blob> {
      return new Promise((resolve, reject) => {
        canvasEl.toBlob(
          blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          type,
          quality
        );
      });
    },

    resize(width: number, height: number): void {
      canvasEl.width = width * scale;
      canvasEl.height = height * scale;
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      ctx.scale(scale, scale);
    },
  };

  return drawContext;
}

// ============================================================================
// Image Utilities
// ============================================================================

/**
 * Load image as HTMLImageElement
 * @param src - Image source URL or data URL
 * @returns Loaded image element
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Resize image options
 */
export interface ResizeImageOptions {
  /** Maximum width */
  maxWidth?: number;
  /** Maximum height */
  maxHeight?: number;
  /** Exact width (overrides maxWidth) */
  width?: number;
  /** Exact height (overrides maxHeight) */
  height?: number;
  /** Maintain aspect ratio */
  maintainAspectRatio?: boolean;
  /** Output format */
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
  /** Quality for jpeg/webp (0-1) */
  quality?: number;
}

/**
 * Resize an image
 * @param source - Image source (URL, data URL, Blob, or File)
 * @param options - Resize options
 * @returns Resized image as data URL
 */
export async function resizeImage(
  source: string | Blob | File,
  options: ResizeImageOptions
): Promise<string> {
  const {
    maxWidth,
    maxHeight,
    width,
    height,
    maintainAspectRatio = true,
    format = 'image/png',
    quality,
  } = options;

  // Load image
  let src: string;
  if (source instanceof Blob) {
    src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  } else {
    src = source;
  }

  const img = await loadImage(src);

  // Calculate dimensions
  let newWidth = width ?? img.width;
  let newHeight = height ?? img.height;

  if (!width && !height && (maxWidth || maxHeight)) {
    const widthRatio = maxWidth ? maxWidth / img.width : Infinity;
    const heightRatio = maxHeight ? maxHeight / img.height : Infinity;

    if (maintainAspectRatio) {
      const ratio = Math.min(widthRatio, heightRatio, 1);
      newWidth = Math.round(img.width * ratio);
      newHeight = Math.round(img.height * ratio);
    } else {
      newWidth = maxWidth && img.width > maxWidth ? maxWidth : img.width;
      newHeight = maxHeight && img.height > maxHeight ? maxHeight : img.height;
    }
  } else if (maintainAspectRatio && (width || height)) {
    if (width && !height) {
      newHeight = Math.round(img.height * (width / img.width));
    } else if (height && !width) {
      newWidth = Math.round(img.width * (height / img.height));
    }
  }

  // Create canvas and draw
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, newWidth, newHeight);

  return canvas.toDataURL(format, quality);
}

/**
 * Crop image options
 */
export interface CropImageOptions {
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Crop width */
  width: number;
  /** Crop height */
  height: number;
  /** Output format */
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
  /** Quality for jpeg/webp (0-1) */
  quality?: number;
}

/**
 * Crop an image
 * @param source - Image source
 * @param options - Crop options
 * @returns Cropped image as data URL
 */
export async function cropImage(
  source: string | Blob | File,
  options: CropImageOptions
): Promise<string> {
  const { x, y, width, height, format = 'image/png', quality } = options;

  let src: string;
  if (source instanceof Blob) {
    src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  } else {
    src = source;
  }

  const img = await loadImage(src);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

  return canvas.toDataURL(format, quality);
}

/**
 * Image filter types
 */
export type ImageFilter =
  | 'grayscale'
  | 'sepia'
  | 'invert'
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'saturate'
  | 'hue-rotate';

/**
 * Apply filter to image
 * @param source - Image source
 * @param filter - Filter to apply
 * @param amount - Filter amount (depends on filter type)
 * @param format - Output format
 * @returns Filtered image as data URL
 */
export async function applyImageFilter(
  source: string | Blob | File,
  filter: ImageFilter,
  amount: number = 100,
  format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png'
): Promise<string> {
  let src: string;
  if (source instanceof Blob) {
    src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  } else {
    src = source;
  }

  const img = await loadImage(src);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d')!;

  // Build filter string
  let filterString: string;
  switch (filter) {
    case 'grayscale':
      filterString = `grayscale(${amount}%)`;
      break;
    case 'sepia':
      filterString = `sepia(${amount}%)`;
      break;
    case 'invert':
      filterString = `invert(${amount}%)`;
      break;
    case 'blur':
      filterString = `blur(${amount}px)`;
      break;
    case 'brightness':
      filterString = `brightness(${amount}%)`;
      break;
    case 'contrast':
      filterString = `contrast(${amount}%)`;
      break;
    case 'saturate':
      filterString = `saturate(${amount}%)`;
      break;
    case 'hue-rotate':
      filterString = `hue-rotate(${amount}deg)`;
      break;
    default:
      filterString = '';
  }

  ctx.filter = filterString;
  ctx.drawImage(img, 0, 0);

  return canvas.toDataURL(format);
}

/**
 * Measure text dimensions
 */
export interface TextMetrics {
  width: number;
  height: number;
  actualBoundingBoxAscent: number;
  actualBoundingBoxDescent: number;
}

/**
 * Measure text dimensions
 * @param text - Text to measure
 * @param font - Font specification
 * @returns Text metrics
 */
export function measureText(
  text: string,
  font = '16px sans-serif'
): TextMetrics {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;

  const metrics = ctx.measureText(text);

  return {
    width: metrics.width,
    height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
    actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
  };
}

/**
 * Generate image thumbnail
 * @param source - Image source
 * @param size - Thumbnail size (max dimension)
 * @returns Thumbnail as data URL
 */
export async function generateThumbnail(
  source: string | Blob | File,
  size = 100
): Promise<string> {
  return resizeImage(source, {
    maxWidth: size,
    maxHeight: size,
    maintainAspectRatio: true,
    format: 'image/jpeg',
    quality: 0.8,
  });
}

/**
 * Convert canvas to blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Check canvas support
 */
export function isCanvasSupported(): boolean {
  if (!isBrowser()) return false;
  const canvas = document.createElement('canvas');
  return !!(canvas.getContext && canvas.getContext('2d'));
}

/**
 * Check WebGL support
 */
export function isWebGLSupported(): boolean {
  if (!isBrowser()) return false;
  const canvas = document.createElement('canvas');
  return !!(
    window.WebGLRenderingContext &&
    (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  );
}

/**
 * Check WebGL2 support
 */
export function isWebGL2Supported(): boolean {
  if (!isBrowser()) return false;
  const canvas = document.createElement('canvas');
  return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
}
