/**
 * Fuzzy Search Utilities
 * @module utils/search
 * @description Fuzzy string matching, full-text search indexing,
 * and search result highlighting.
 */

/**
 * Fuzzy match result
 */
export interface FuzzyMatch {
  /** Original item */
  item: string;
  /** Match score (0-1, higher is better) */
  score: number;
  /** Matched character indices */
  matches: number[];
  /** Highlighted string with markers */
  highlighted: string;
}

/**
 * Fuzzy search options
 */
export interface FuzzySearchOptions {
  /** Case-sensitive matching */
  caseSensitive?: boolean;
  /** Minimum score threshold (0-1) */
  threshold?: number;
  /** Maximum results to return */
  limit?: number;
  /** Sort results by score */
  sort?: boolean;
  /** Highlight markers [start, end] */
  highlightMarkers?: [string, string];
}

/**
 * Fuzzy match a query against a target string
 * @param query - Search query
 * @param target - Target string to match against
 * @param options - Match options
 * @returns Match result with score and indices
 * @example
 * fuzzyMatch('jq', 'jQuery') // { score: 0.8, matches: [0, 1] }
 */
export function fuzzyMatch(
  query: string,
  target: string,
  options: FuzzySearchOptions = {}
): FuzzyMatch | null {
  const {
    caseSensitive = false,
    threshold = 0,
    highlightMarkers = ['<mark>', '</mark>'],
  } = options;

  const q = caseSensitive ? query : query.toLowerCase();
  const t = caseSensitive ? target : target.toLowerCase();

  if (q.length === 0) {
    return { item: target, score: 1, matches: [], highlighted: target };
  }

  if (t.length === 0) {
    return null;
  }

  // Check if query is longer than target
  if (q.length > t.length) {
    return null;
  }

  const matches: number[] = [];
  let queryIdx = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;
  let lastMatchIdx = -2;

  // Find matching characters
  for (let i = 0; i < t.length && queryIdx < q.length; i++) {
    if (t[i] === q[queryIdx]) {
      matches.push(i);

      // Track consecutive matches
      if (i === lastMatchIdx + 1) {
        consecutiveMatches++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
      } else {
        consecutiveMatches = 1;
      }

      lastMatchIdx = i;
      queryIdx++;
    }
  }

  // All query characters must be found
  if (queryIdx !== q.length) {
    return null;
  }

  // Calculate score based on multiple factors
  let score = 0;

  // Base score: percentage of query found
  score += (matches.length / target.length) * 0.3;

  // Bonus for consecutive matches
  score += (maxConsecutive / q.length) * 0.3;

  // Bonus for starting at beginning
  if (matches[0] === 0) {
    score += 0.15;
  }

  // Bonus for word boundary matches
  const wordBoundaryBonus = matches.reduce((bonus, idx) => {
    if (idx === 0) return bonus + 0.05;
    const prevChar = target[idx - 1];
    if (
      /[\s\-_./]/.test(prevChar) ||
      (prevChar === prevChar.toLowerCase() &&
        target[idx] !== target[idx].toLowerCase())
    ) {
      return bonus + 0.05;
    }
    return bonus;
  }, 0);
  score += Math.min(wordBoundaryBonus, 0.2);

  // Penalty for spread-out matches
  const spread = matches[matches.length - 1] - matches[0];
  const spreadPenalty =
    spread > q.length * 2 ? (spread - q.length * 2) * 0.01 : 0;
  score -= Math.min(spreadPenalty, 0.2);

  // Normalize score
  score = Math.max(0, Math.min(1, score));

  if (score < threshold) {
    return null;
  }

  // Create highlighted string
  const [startMark, endMark] = highlightMarkers;
  let highlighted = '';
  let lastIdx = 0;

  for (const matchIdx of matches) {
    highlighted += target.slice(lastIdx, matchIdx);
    highlighted += startMark + target[matchIdx] + endMark;
    lastIdx = matchIdx + 1;
  }
  highlighted += target.slice(lastIdx);

  return {
    item: target,
    score,
    matches,
    highlighted,
  };
}

/**
 * Fuzzy search through an array of strings
 * @param query - Search query
 * @param items - Items to search
 * @param options - Search options
 * @returns Matched items with scores
 * @example
 * fuzzySearch('jq', ['jQuery', 'React', 'Vue', 'Angular'])
 * // [{ item: 'jQuery', score: 0.8, ... }]
 */
export function fuzzySearch(
  query: string,
  items: string[],
  options: FuzzySearchOptions = {}
): FuzzyMatch[] {
  const { limit, sort = true } = options;

  const results: FuzzyMatch[] = [];

  for (const item of items) {
    const match = fuzzyMatch(query, item, options);
    if (match) {
      results.push(match);
    }
  }

  if (sort) {
    results.sort((a, b) => b.score - a.score);
  }

  if (limit !== undefined) {
    return results.slice(0, limit);
  }

  return results;
}

/**
 * Fuzzy search through objects by a key
 */
export interface FuzzyObjectMatch<T> extends FuzzyMatch {
  /** Original object */
  original: T;
}

/**
 * Fuzzy search through an array of objects
 * @param query - Search query
 * @param items - Items to search
 * @param key - Key to search on (or function to extract search text)
 * @param options - Search options
 * @returns Matched items with scores
 * @example
 * fuzzySearchObjects('joh', users, 'name')
 * // [{ item: 'John', score: 0.9, original: { name: 'John', id: 1 }, ... }]
 */
export function fuzzySearchObjects<T>(
  query: string,
  items: T[],
  key: keyof T | ((item: T) => string),
  options: FuzzySearchOptions = {}
): FuzzyObjectMatch<T>[] {
  const { limit, sort = true } = options;

  const getText =
    typeof key === 'function' ? key : (item: T) => String(item[key]);
  const results: FuzzyObjectMatch<T>[] = [];

  for (const item of items) {
    const text = getText(item);
    const match = fuzzyMatch(query, text, options);
    if (match) {
      results.push({ ...match, original: item });
    }
  }

  if (sort) {
    results.sort((a, b) => b.score - a.score);
  }

  if (limit !== undefined) {
    return results.slice(0, limit);
  }

  return results;
}

/**
 * Multi-key fuzzy search
 */
export function fuzzySearchMultiKey<T>(
  query: string,
  items: T[],
  keys: Array<keyof T | ((item: T) => string)>,
  options: FuzzySearchOptions & { keyWeights?: number[] } = {}
): FuzzyObjectMatch<T>[] {
  const {
    keyWeights = keys.map(() => 1),
    limit,
    sort = true,
    ...matchOptions
  } = options;

  const results: FuzzyObjectMatch<T>[] = [];

  for (const item of items) {
    let bestMatch: FuzzyMatch | null = null;
    let weightedScore = 0;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const getText =
        typeof key === 'function' ? key : (obj: T) => String(obj[key]);
      const text = getText(item);
      const match = fuzzyMatch(query, text, matchOptions);

      if (match) {
        const weighted = match.score * (keyWeights[i] || 1);
        if (weighted > weightedScore) {
          weightedScore = weighted;
          bestMatch = match;
        }
      }
    }

    if (bestMatch && weightedScore >= (options.threshold || 0)) {
      results.push({
        ...bestMatch,
        score: weightedScore,
        original: item,
      });
    }
  }

  if (sort) {
    results.sort((a, b) => b.score - a.score);
  }

  if (limit !== undefined) {
    return results.slice(0, limit);
  }

  return results;
}

// ============================================================================
// Full-Text Search Index
// ============================================================================

/**
 * Search index options
 */
export interface SearchIndexOptions {
  /** Fields to index */
  fields?: string[];
  /** Tokenizer function */
  tokenizer?: (text: string) => string[];
  /** Stemmer function */
  stemmer?: (word: string) => string;
  /** Stop words to ignore */
  stopWords?: Set<string>;
  /** Field boost weights */
  fieldWeights?: Record<string, number>;
}

/**
 * Search index entry
 */
interface IndexEntry {
  docId: string | number;
  field: string;
  positions: number[];
  tf: number; // Term frequency
}

/**
 * Simple full-text search index
 */
export class SearchIndex<T extends Record<string, unknown>> {
  private documents = new Map<string | number, T>();
  private index = new Map<string, IndexEntry[]>();
  private fieldLengths = new Map<string, Map<string | number, number>>();
  private avgFieldLengths = new Map<string, number>();
  private options: Required<SearchIndexOptions>;

  private static defaultStopWords = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'has',
    'he',
    'in',
    'is',
    'it',
    'its',
    'of',
    'on',
    'or',
    'that',
    'the',
    'to',
    'was',
    'were',
    'will',
    'with',
  ]);

  constructor(options: SearchIndexOptions = {}) {
    this.options = {
      fields: options.fields || [],
      tokenizer: options.tokenizer || this.defaultTokenizer,
      stemmer: options.stemmer || ((word: string) => word),
      stopWords: options.stopWords || SearchIndex.defaultStopWords,
      fieldWeights: options.fieldWeights || {},
    };
  }

  private defaultTokenizer(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  /**
   * Add a document to the index
   */
  add(docId: string | number, doc: T): void {
    this.documents.set(docId, doc);

    const fields =
      this.options.fields.length > 0
        ? this.options.fields
        : Object.keys(doc).filter(k => typeof doc[k] === 'string');

    for (const field of fields) {
      const text = String(doc[field] || '');
      const tokens = this.options.tokenizer(text);

      // Track field length
      if (!this.fieldLengths.has(field)) {
        this.fieldLengths.set(field, new Map());
      }
      this.fieldLengths.get(field)!.set(docId, tokens.length);

      // Index tokens
      const termCounts = new Map<string, number[]>();

      tokens.forEach((token, position) => {
        if (this.options.stopWords.has(token)) return;

        const term = this.options.stemmer(token);
        if (!termCounts.has(term)) {
          termCounts.set(term, []);
        }
        termCounts.get(term)!.push(position);
      });

      for (const [term, positions] of termCounts) {
        if (!this.index.has(term)) {
          this.index.set(term, []);
        }

        this.index.get(term)!.push({
          docId,
          field,
          positions,
          tf: positions.length / tokens.length,
        });
      }
    }

    // Update average field lengths
    for (const [field, lengths] of this.fieldLengths) {
      const total = Array.from(lengths.values()).reduce((a, b) => a + b, 0);
      this.avgFieldLengths.set(field, total / lengths.size);
    }
  }

  /**
   * Add multiple documents
   */
  addAll(documents: Array<{ id: string | number; doc: T }>): void {
    for (const { id, doc } of documents) {
      this.add(id, doc);
    }
  }

  /**
   * Remove a document from the index
   */
  remove(docId: string | number): boolean {
    if (!this.documents.has(docId)) {
      return false;
    }

    this.documents.delete(docId);

    // Remove from index
    for (const entries of this.index.values()) {
      const idx = entries.findIndex(e => e.docId === docId);
      if (idx !== -1) {
        entries.splice(idx, 1);
      }
    }

    // Remove from field lengths
    for (const lengths of this.fieldLengths.values()) {
      lengths.delete(docId);
    }

    return true;
  }

  /**
   * Search the index
   */
  search(
    query: string,
    options: { limit?: number; threshold?: number } = {}
  ): Array<{ doc: T; score: number; docId: string | number }> {
    const { limit = 10, threshold = 0 } = options;
    const tokens = this.options
      .tokenizer(query)
      .filter(t => !this.options.stopWords.has(t))
      .map(t => this.options.stemmer(t));

    if (tokens.length === 0) {
      return [];
    }

    const docScores = new Map<string | number, number>();
    const N = this.documents.size;

    for (const term of tokens) {
      const entries = this.index.get(term) || [];
      const df = entries.length; // Document frequency

      if (df === 0) continue;

      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1); // BM25 IDF

      for (const entry of entries) {
        const { docId, field, tf } = entry;

        // BM25 scoring
        const k1 = 1.2;
        const b = 0.75;
        const fieldLength = this.fieldLengths.get(field)?.get(docId) || 0;
        const avgLength = this.avgFieldLengths.get(field) || 1;
        const fieldWeight = this.options.fieldWeights[field] || 1;

        const score =
          idf *
          ((tf * (k1 + 1)) /
            (tf + k1 * (1 - b + b * (fieldLength / avgLength)))) *
          fieldWeight;

        docScores.set(docId, (docScores.get(docId) || 0) + score);
      }
    }

    // Sort and filter results
    const results = Array.from(docScores.entries())
      .filter(([_, score]) => score >= threshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([docId, score]) => ({
        docId,
        doc: this.documents.get(docId)!,
        score,
      }));

    return results;
  }

  /**
   * Get document by ID
   */
  get(docId: string | number): T | undefined {
    return this.documents.get(docId);
  }

  /**
   * Get all documents
   */
  getAll(): T[] {
    return Array.from(this.documents.values());
  }

  /**
   * Clear the index
   */
  clear(): void {
    this.documents.clear();
    this.index.clear();
    this.fieldLengths.clear();
    this.avgFieldLengths.clear();
  }

  /**
   * Get index size
   */
  get size(): number {
    return this.documents.size;
  }
}

/**
 * Create a search index
 */
export function createSearchIndex<T extends Record<string, unknown>>(
  options?: SearchIndexOptions
): SearchIndex<T> {
  return new SearchIndex<T>(options);
}

// ============================================================================
// Highlight Utilities
// ============================================================================

/**
 * Highlight search terms in text
 * @param text - Text to highlight
 * @param terms - Terms to highlight
 * @param markers - Start and end markers
 * @returns Highlighted text
 */
export function highlightTerms(
  text: string,
  terms: string | string[],
  markers: [string, string] = ['<mark>', '</mark>']
): string {
  const termArray = Array.isArray(terms) ? terms : [terms];
  const [start, end] = markers;

  // Escape regex special characters
  const escaped = termArray.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  return text.replace(regex, `${start}$1${end}`);
}

/**
 * Extract snippets around matched terms
 */
export function extractSnippet(
  text: string,
  terms: string | string[],
  options: {
    maxLength?: number;
    contextWords?: number;
    ellipsis?: string;
    markers?: [string, string];
  } = {}
): string {
  const {
    maxLength = 200,
    contextWords = 5,
    ellipsis = '...',
    markers = ['<mark>', '</mark>'],
  } = options;

  const termArray = Array.isArray(terms) ? terms : [terms];
  const words = text.split(/\s+/);

  // Find positions of matching words
  const matchPositions: number[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    if (termArray.some(t => word.includes(t.toLowerCase()))) {
      matchPositions.push(i);
    }
  }

  if (matchPositions.length === 0) {
    // No matches, return start of text
    const snippet = words.slice(0, Math.ceil(maxLength / 5)).join(' ');
    return snippet.length < text.length ? snippet + ellipsis : snippet;
  }

  // Build snippet around first match
  const firstMatch = matchPositions[0];
  const start = Math.max(0, firstMatch - contextWords);
  const end = Math.min(words.length, firstMatch + contextWords + 1);

  let snippet = words.slice(start, end).join(' ');

  // Add ellipsis if truncated
  if (start > 0) snippet = ellipsis + snippet;
  if (end < words.length) snippet = snippet + ellipsis;

  // Truncate if still too long
  if (snippet.length > maxLength) {
    snippet = snippet.slice(0, maxLength - ellipsis.length) + ellipsis;
  }

  // Highlight terms
  return highlightTerms(snippet, termArray, markers);
}

/**
 * Calculate relevance score between query and text
 */
export function calculateRelevance(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  const textWords = text.toLowerCase().split(/\s+/);
  const textSet = new Set(textWords);

  let matches = 0;
  for (const word of queryWords) {
    if (textSet.has(word)) {
      matches++;
    }
  }

  return matches / queryWords.length;
}

/**
 * Suggest similar queries based on indexed content
 */
export function suggestQueries<T extends Record<string, unknown>>(
  partialQuery: string,
  index: SearchIndex<T>,
  limit = 5
): string[] {
  const docs = index.getAll();
  const suggestions = new Set<string>();

  const queryLower = partialQuery.toLowerCase();

  for (const doc of docs) {
    for (const value of Object.values(doc)) {
      if (typeof value === 'string') {
        const words = value.split(/\s+/);
        for (const word of words) {
          if (
            word.toLowerCase().startsWith(queryLower) &&
            word.length > partialQuery.length
          ) {
            suggestions.add(word);
            if (suggestions.size >= limit * 2) break;
          }
        }
      }
    }
    if (suggestions.size >= limit * 2) break;
  }

  // Sort by length and take limit
  return Array.from(suggestions)
    .sort((a, b) => a.length - b.length)
    .slice(0, limit);
}
