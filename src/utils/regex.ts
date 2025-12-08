/**
 * Regex Utilities
 * @module utils/regex
 * @description Regular expression builder and common patterns.
 */

/**
 * Regex Builder
 */
export class RegexBuilder {
  private parts: string[] = [];

  literal(str: string): this {
    this.parts.push(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return this;
  }

  startOfString(): this {
    this.parts.push('^');
    return this;
  }

  endOfString(): this {
    this.parts.push('$');
    return this;
  }

  digit(): this {
    this.parts.push('\\d');
    return this;
  }

  whitespace(): this {
    this.parts.push('\\s');
    return this;
  }

  word(): this {
    this.parts.push('\\w');
    return this;
  }

  any(): this {
    this.parts.push('.');
    return this;
  }

  wordBoundary(): this {
    this.parts.push('\\b');
    return this;
  }

  oneOrMore(): this {
    this.modifyLast('+');
    return this;
  }

  optional(): this {
    this.modifyLast('?');
    return this;
  }

  lazy(): this {
    const last = this.parts.pop();
    if (last) {
      this.parts.push(last + '?');
    }
    return this;
  }

  exactly(n: number): this {
    this.modifyLast(`{${n}}`);
    return this;
  }

  between(min: number, max: number): this {
    this.modifyLast(`{${min},${max}}`);
    return this;
  }

  group(fn: (builder: RegexBuilder) => RegexBuilder): this {
    const subBuilder = new RegexBuilder();
    fn(subBuilder);
    this.parts.push(`(${subBuilder.parts.join('')})`);
    return this;
  }

  namedGroup(name: string, fn: (builder: RegexBuilder) => RegexBuilder): this {
    const subBuilder = new RegexBuilder();
    fn(subBuilder);
    this.parts.push(`(?<${name}>${subBuilder.parts.join('')})`);
    return this;
  }

  either(...fns: Array<(builder: RegexBuilder) => RegexBuilder>): this {
    const options = fns.map(fn => {
      const subBuilder = new RegexBuilder();
      fn(subBuilder);
      return subBuilder.parts.join('');
    });
    this.parts.push(`(?:${options.join('|')})`);
    return this;
  }

  charSet(chars: string): this {
    this.parts.push(`[${chars.replace(/[\]\\]/g, '\\$&')}]`);
    return this;
  }

  charSetNegated(chars: string): this {
    this.parts.push(`[^${chars.replace(/[\]\\]/g, '\\$&')}]`);
    return this;
  }

  range(start: string, end: string): this {
    this.parts.push(`[${start}-${end}]`);
    return this;
  }

  lookahead(fn: (builder: RegexBuilder) => RegexBuilder): this {
    const subBuilder = new RegexBuilder();
    fn(subBuilder);
    this.parts.push(`(?=${subBuilder.parts.join('')})`);
    return this;
  }

  negativeLookahead(fn: (builder: RegexBuilder) => RegexBuilder): this {
    const subBuilder = new RegexBuilder();
    fn(subBuilder);
    this.parts.push(`(?!${subBuilder.parts.join('')})`);
    return this;
  }

  lookbehind(fn: (builder: RegexBuilder) => RegexBuilder): this {
    const subBuilder = new RegexBuilder();
    fn(subBuilder);
    this.parts.push(`(?<=${subBuilder.parts.join('')})`);
    return this;
  }

  build(flags?: string): RegExp {
    return new RegExp(this.parts.join(''), flags);
  }

  private modifyLast(modifier: string): void {
    const last = this.parts.pop();
    if (last) {
      if (
        last.length > 1 &&
        !last.startsWith('\\') &&
        !last.startsWith('(?:') &&
        !last.startsWith('(') &&
        !last.startsWith('[')
      ) {
        this.parts.push(`(?:${last})${modifier}`);
      } else {
        this.parts.push(`${last}${modifier}`);
      }
    }
  }
}

/**
 * Common regex patterns
 */
export const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  url: /^((https?|ftp):\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  dateISO: /^\d{4}-\d{2}-\d{2}$/,
  dateUS: /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/,
  dateEU: /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.\d{4}$/,
  time24: /^([01]\d|2[0-3]):([0-5]\d)$/,
  time12: /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  digits: /^\d+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphabetic: /^[a-zA-Z]+$/,
  whitespace: /^\s+$/,
  nonWhitespace: /^\S+$/,
  phone: /^\+?[0-9\s\-().]+$/,
  hexColor: /^#?(?:[0-9a-fA-F]{3}){1,2}$/,
  creditCard:
    /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11}|(?:\d{4}[- ]){3}\d{4})$/,
  semver:
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
  hashtag: /#[a-zA-Z0-9_]+/g,
  mention: /@[a-zA-Z0-9_]+/g,
};

/**
 * Escape special characters in string
 */
export function escape(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if string matches pattern
 */
export function isMatch(str: string, pattern: RegExp): boolean {
  return pattern.test(str);
}

/**
 * Find all matches
 */
export function findAll(str: string, pattern: RegExp): string[] {
  const flags = pattern.flags.includes('g')
    ? pattern.flags
    : pattern.flags + 'g';
  const globalPattern = new RegExp(pattern.source, flags);
  const matches = str.match(globalPattern);
  return matches ? Array.from(matches) : [];
}

/**
 * Replace all matches
 */
export function replaceAll(
  str: string,
  pattern: RegExp,
  replacement: string
): string {
  return str.replace(pattern, replacement);
}

/**
 * Extract named groups
 */
export function extractGroups(
  text: string,
  pattern: RegExp
): Record<string, string> | string[] | null {
  const match = text.match(pattern);
  if (!match) return null;
  if (match.groups && Object.keys(match.groups).length > 0) return match.groups;
  return match.slice(1);
}

/**
 * Split string by pattern
 */
export function split(str: string, pattern: RegExp, limit?: number): string[] {
  return str.split(pattern, limit);
}

/**
 * Test string against pattern (alias for isMatch)
 */
export function test(str: string, pattern: RegExp): boolean {
  return pattern.test(str);
}

/**
 * Create pattern from string
 */
export function createPattern(pattern: string, flags?: string): RegExp {
  return new RegExp(pattern, flags);
}

/**
 * Combine patterns
 */
export function combine(patterns: RegExp[], flags?: string): RegExp {
  const source = patterns.map(p => p.source).join('|');
  return new RegExp(`(?:${source})`, flags);
}

/**
 * Create validator function
 */
export function createValidator(pattern: RegExp): (str: string) => boolean {
  return (str: string) => pattern.test(str);
}

export const regex = {
  RegexBuilder,
  patterns,
  escape,
  isMatch,
  findAll,
  replaceAll,
  extractGroups,
  split,
  test,
  createPattern,
  combine,
  createValidator,
};
