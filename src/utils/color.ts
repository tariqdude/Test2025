/**
 * Color Utilities
 */

/**
 * RGB color type
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * RGBA color type
 */
export interface RGBA extends RGB {
  a: number;
}

/**
 * HSL color type
 */
export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * HSLA color type
 */
export interface HSLA extends HSL {
  a: number;
}

/**
 * Convert Hex color to RGB object
 */
export function hexToRgb(hex: string): RGB | null {
  // Handle shorthand hex (e.g., #fff)
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(
    shorthandRegex,
    (_, r, g, b) => r + r + g + g + b + b
  );

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB values to Hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.min(255, Math.max(0, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert Hex to HSL
 */
export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

/**
 * Convert HSL to Hex
 */
export function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Lighten a color by percentage
 */
export function lighten(hex: string, percent: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;

  hsl.l = Math.min(100, hsl.l + percent);
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

/**
 * Darken a color by percentage
 */
export function darken(hex: string, percent: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;

  hsl.l = Math.max(0, hsl.l - percent);
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

/**
 * Saturate a color by percentage
 */
export function saturate(hex: string, percent: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;

  hsl.s = Math.min(100, hsl.s + percent);
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

/**
 * Desaturate a color by percentage
 */
export function desaturate(hex: string, percent: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;

  hsl.s = Math.max(0, hsl.s - percent);
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

/**
 * Adjust color opacity
 */
export function setOpacity(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(1, Math.max(0, opacity))})`;
}

/**
 * Mix two colors together
 */
export function mixColors(
  color1: string,
  color2: string,
  weight = 0.5
): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return color1;

  const w = Math.min(1, Math.max(0, weight));

  return rgbToHex(
    Math.round(rgb1.r * (1 - w) + rgb2.r * w),
    Math.round(rgb1.g * (1 - w) + rgb2.g * w),
    Math.round(rgb1.b * (1 - w) + rgb2.b * w)
  );
}

/**
 * Get complementary color
 */
export function complementary(hex: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;

  hsl.h = (hsl.h + 180) % 360;
  return hslToHex(hsl.h, hsl.s, hsl.l);
}

/**
 * Get triadic colors
 */
export function triadic(hex: string): [string, string, string] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [hex, hex, hex];

  return [
    hex,
    hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
    hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
  ];
}

/**
 * Get analogous colors
 */
export function analogous(hex: string, angle = 30): [string, string, string] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [hex, hex, hex];

  return [
    hslToHex((hsl.h - angle + 360) % 360, hsl.s, hsl.l),
    hex,
    hslToHex((hsl.h + angle) % 360, hsl.s, hsl.l),
  ];
}

/**
 * Get split-complementary colors
 */
export function splitComplementary(hex: string): [string, string, string] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [hex, hex, hex];

  return [
    hex,
    hslToHex((hsl.h + 150) % 360, hsl.s, hsl.l),
    hslToHex((hsl.h + 210) % 360, hsl.s, hsl.l),
  ];
}

/**
 * Calculate relative luminance (for contrast calculations)
 */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r =
    rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g =
    gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b =
    bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors (WCAG)
 */
export function contrastRatio(color1: string, color2: string): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 */
export function meetsWcagAA(
  color1: string,
  color2: string,
  largeText = false
): boolean {
  const ratio = contrastRatio(color1, color2);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standard
 */
export function meetsWcagAAA(
  color1: string,
  color2: string,
  largeText = false
): boolean {
  const ratio = contrastRatio(color1, color2);
  return largeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Determine if color is light or dark
 */
export function isLight(hex: string): boolean {
  return relativeLuminance(hex) > 0.179;
}

/**
 * Get best text color (black or white) for background
 */
export function getContrastTextColor(backgroundColor: string): string {
  return isLight(backgroundColor) ? '#000000' : '#ffffff';
}

/**
 * Generate a color palette (shades)
 */
export function generatePalette(baseColor: string, steps = 9): string[] {
  const hsl = hexToHsl(baseColor);
  if (!hsl) return [baseColor];

  const palette: string[] = [];
  const lightStep = (100 - hsl.l) / Math.ceil(steps / 2);
  const darkStep = hsl.l / Math.floor(steps / 2);

  // Lighter shades
  for (let i = Math.ceil(steps / 2) - 1; i > 0; i--) {
    palette.push(hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + lightStep * i)));
  }

  // Base color
  palette.push(baseColor);

  // Darker shades
  for (let i = 1; i <= Math.floor(steps / 2); i++) {
    palette.push(hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - darkStep * i)));
  }

  return palette;
}

/**
 * Parse any color string to RGB
 */
export function parseColor(color: string): RGB | null {
  // Try hex
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  // Try rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Try hsl/hsla
  const hslMatch = color.match(/hsla?\((\d+),\s*(\d+)%?,\s*(\d+)%?/);
  if (hslMatch) {
    return hslToRgb(
      parseInt(hslMatch[1], 10),
      parseInt(hslMatch[2], 10),
      parseInt(hslMatch[3], 10)
    );
  }

  return null;
}

/**
 * Random hex color
 */
export function randomColor(): string {
  return (
    '#' +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
  );
}

/**
 * Random color with specific hue range
 */
export function randomColorInHueRange(
  minHue: number,
  maxHue: number,
  saturation = 70,
  lightness = 50
): string {
  const h = Math.floor(Math.random() * (maxHue - minHue + 1)) + minHue;
  return hslToHex(h, saturation, lightness);
}
