/**
 * Binary and Buffer Utilities
 * @module utils/binary
 * @description Utilities for working with binary data, ArrayBuffers,
 * TypedArrays, and encoding/decoding operations.
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Supported typed array types
 */
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

/**
 * Buffer-like input
 */
export type BufferLike =
  | ArrayBuffer
  | TypedArray
  | DataView
  | number[]
  | string;

/**
 * Endianness
 */
export type Endianness = 'little' | 'big';

// ============================================================================
// Conversion Utilities
// ============================================================================

/**
 * Convert various inputs to Uint8Array
 */
export function toUint8Array(input: BufferLike): Uint8Array {
  if (input instanceof Uint8Array) {
    return input;
  }

  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }

  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }

  if (Array.isArray(input)) {
    return new Uint8Array(input);
  }

  if (typeof input === 'string') {
    return new TextEncoder().encode(input);
  }

  throw new TypeError('Cannot convert input to Uint8Array');
}

/**
 * Convert Uint8Array to string (UTF-8)
 */
export function toString(buffer: Uint8Array): string {
  return new TextDecoder().decode(buffer);
}

/**
 * Convert Uint8Array to hex string
 */
export function toHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function fromHex(hex: string): Uint8Array {
  const cleanHex = hex.replace(/\s/g, '');
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
    if (isNaN(byte)) {
      throw new Error(`Invalid hex character at position ${i * 2}`);
    }
    bytes[i] = byte;
  }
  return bytes;
}

/**
 * Convert Uint8Array to Base64 string
 */
export function toBase64(buffer: Uint8Array): string {
  if (typeof btoa === 'function') {
    // Browser
    return btoa(String.fromCharCode(...buffer));
  }
  // Node.js fallback
  return Buffer.from(buffer).toString('base64');
}

/**
 * Convert Base64 string to Uint8Array
 */
export function fromBase64(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    // Browser
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  // Node.js fallback
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Convert Uint8Array to Base64URL string (URL-safe)
 */
export function toBase64Url(buffer: Uint8Array): string {
  return toBase64(buffer)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Convert Base64URL string to Uint8Array
 */
export function fromBase64Url(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  return fromBase64(base64);
}

// ============================================================================
// Buffer Operations
// ============================================================================

/**
 * Concatenate multiple buffers
 */
export function concat(...buffers: BufferLike[]): Uint8Array {
  const arrays = buffers.map(toUint8Array);
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}

/**
 * Compare two buffers
 * @returns negative if a < b, positive if a > b, 0 if equal
 */
export function compare(a: BufferLike, b: BufferLike): number {
  const arrA = toUint8Array(a);
  const arrB = toUint8Array(b);
  const minLength = Math.min(arrA.length, arrB.length);

  for (let i = 0; i < minLength; i++) {
    if (arrA[i] !== arrB[i]) {
      return arrA[i] - arrB[i];
    }
  }

  return arrA.length - arrB.length;
}

/**
 * Check if two buffers are equal
 */
export function equals(a: BufferLike, b: BufferLike): boolean {
  return compare(a, b) === 0;
}

/**
 * Slice a buffer
 */
export function slice(
  buffer: BufferLike,
  start: number = 0,
  end?: number
): Uint8Array {
  const arr = toUint8Array(buffer);
  return arr.slice(start, end);
}

/**
 * Fill a buffer with a value
 */
export function fill(
  buffer: Uint8Array,
  value: number,
  start = 0,
  end = buffer.length
): Uint8Array {
  buffer.fill(value, start, end);
  return buffer;
}

/**
 * Create a buffer filled with zeros
 */
export function zeros(length: number): Uint8Array {
  return new Uint8Array(length);
}

/**
 * Create a buffer filled with random bytes
 */
export function random(length: number): Uint8Array {
  const buffer = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buffer);
  } else {
    // Fallback (not cryptographically secure)
    for (let i = 0; i < length; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  }
  return buffer;
}

/**
 * Copy a buffer
 */
export function copy(buffer: BufferLike): Uint8Array {
  return slice(buffer);
}

/**
 * Find index of pattern in buffer
 */
export function indexOf(
  buffer: BufferLike,
  pattern: BufferLike,
  start = 0
): number {
  const arr = toUint8Array(buffer);
  const search = toUint8Array(pattern);

  if (search.length === 0) return start;
  if (search.length > arr.length - start) return -1;

  outer: for (let i = start; i <= arr.length - search.length; i++) {
    for (let j = 0; j < search.length; j++) {
      if (arr[i + j] !== search[j]) continue outer;
    }
    return i;
  }

  return -1;
}

/**
 * Split buffer by delimiter
 */
export function split(buffer: BufferLike, delimiter: BufferLike): Uint8Array[] {
  const arr = toUint8Array(buffer);
  const delim = toUint8Array(delimiter);
  const result: Uint8Array[] = [];

  let start = 0;
  let index: number;

  while ((index = indexOf(arr, delim, start)) !== -1) {
    result.push(slice(arr, start, index));
    start = index + delim.length;
  }

  result.push(slice(arr, start));
  return result;
}

// ============================================================================
// Binary Reading/Writing
// ============================================================================

/**
 * Binary reader for sequential reading
 */
export class BinaryReader {
  private view: DataView;
  private offset = 0;
  private littleEndian: boolean;

  constructor(buffer: BufferLike, endianness: Endianness = 'little') {
    const arr = toUint8Array(buffer);
    this.view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    this.littleEndian = endianness === 'little';
  }

  /**
   * Get current position
   */
  get position(): number {
    return this.offset;
  }

  /**
   * Set current position
   */
  set position(pos: number) {
    if (pos < 0 || pos > this.view.byteLength) {
      throw new RangeError('Position out of bounds');
    }
    this.offset = pos;
  }

  /**
   * Get remaining bytes
   */
  get remaining(): number {
    return this.view.byteLength - this.offset;
  }

  /**
   * Check if at end
   */
  get eof(): boolean {
    return this.offset >= this.view.byteLength;
  }

  /**
   * Read unsigned 8-bit integer
   */
  readUint8(): number {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  /**
   * Read signed 8-bit integer
   */
  readInt8(): number {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /**
   * Read unsigned 16-bit integer
   */
  readUint16(): number {
    const value = this.view.getUint16(this.offset, this.littleEndian);
    this.offset += 2;
    return value;
  }

  /**
   * Read signed 16-bit integer
   */
  readInt16(): number {
    const value = this.view.getInt16(this.offset, this.littleEndian);
    this.offset += 2;
    return value;
  }

  /**
   * Read unsigned 32-bit integer
   */
  readUint32(): number {
    const value = this.view.getUint32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }

  /**
   * Read signed 32-bit integer
   */
  readInt32(): number {
    const value = this.view.getInt32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }

  /**
   * Read 32-bit float
   */
  readFloat32(): number {
    const value = this.view.getFloat32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }

  /**
   * Read 64-bit float
   */
  readFloat64(): number {
    const value = this.view.getFloat64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }

  /**
   * Read BigInt64
   */
  readBigInt64(): bigint {
    const value = this.view.getBigInt64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }

  /**
   * Read BigUint64
   */
  readBigUint64(): bigint {
    const value = this.view.getBigUint64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }

  /**
   * Read bytes
   */
  readBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(
      this.view.buffer,
      this.view.byteOffset + this.offset,
      length
    );
    this.offset += length;
    return bytes.slice();
  }

  /**
   * Read null-terminated string
   */
  readCString(): string {
    const bytes: number[] = [];
    while (this.offset < this.view.byteLength) {
      const byte = this.view.getUint8(this.offset++);
      if (byte === 0) break;
      bytes.push(byte);
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  /**
   * Read fixed-length string
   */
  readString(length: number): string {
    const bytes = this.readBytes(length);
    return new TextDecoder().decode(bytes);
  }

  /**
   * Read length-prefixed string (uint8 length)
   */
  readPascalString(): string {
    const length = this.readUint8();
    return this.readString(length);
  }

  /**
   * Skip bytes
   */
  skip(length: number): void {
    this.offset += length;
  }

  /**
   * Seek to position
   */
  seek(position: number): void {
    this.position = position;
  }
}

/**
 * Binary writer for sequential writing
 */
export class BinaryWriter {
  private chunks: Uint8Array[] = [];
  private currentChunk: Uint8Array;
  private offset = 0;
  private littleEndian: boolean;
  private view: DataView;

  constructor(initialSize = 256, endianness: Endianness = 'little') {
    this.currentChunk = new Uint8Array(initialSize);
    this.view = new DataView(this.currentChunk.buffer);
    this.littleEndian = endianness === 'little';
  }

  /**
   * Get current size
   */
  get size(): number {
    return this.chunks.reduce((sum, c) => sum + c.length, 0) + this.offset;
  }

  private ensureCapacity(bytes: number): void {
    if (this.offset + bytes > this.currentChunk.length) {
      this.flush();
      if (bytes > this.currentChunk.length) {
        this.currentChunk = new Uint8Array(bytes);
        this.view = new DataView(this.currentChunk.buffer);
      }
    }
  }

  private flush(): void {
    if (this.offset > 0) {
      this.chunks.push(this.currentChunk.slice(0, this.offset));
      this.offset = 0;
    }
  }

  /**
   * Write unsigned 8-bit integer
   */
  writeUint8(value: number): this {
    this.ensureCapacity(1);
    this.view.setUint8(this.offset, value);
    this.offset += 1;
    return this;
  }

  /**
   * Write signed 8-bit integer
   */
  writeInt8(value: number): this {
    this.ensureCapacity(1);
    this.view.setInt8(this.offset, value);
    this.offset += 1;
    return this;
  }

  /**
   * Write unsigned 16-bit integer
   */
  writeUint16(value: number): this {
    this.ensureCapacity(2);
    this.view.setUint16(this.offset, value, this.littleEndian);
    this.offset += 2;
    return this;
  }

  /**
   * Write signed 16-bit integer
   */
  writeInt16(value: number): this {
    this.ensureCapacity(2);
    this.view.setInt16(this.offset, value, this.littleEndian);
    this.offset += 2;
    return this;
  }

  /**
   * Write unsigned 32-bit integer
   */
  writeUint32(value: number): this {
    this.ensureCapacity(4);
    this.view.setUint32(this.offset, value, this.littleEndian);
    this.offset += 4;
    return this;
  }

  /**
   * Write signed 32-bit integer
   */
  writeInt32(value: number): this {
    this.ensureCapacity(4);
    this.view.setInt32(this.offset, value, this.littleEndian);
    this.offset += 4;
    return this;
  }

  /**
   * Write 32-bit float
   */
  writeFloat32(value: number): this {
    this.ensureCapacity(4);
    this.view.setFloat32(this.offset, value, this.littleEndian);
    this.offset += 4;
    return this;
  }

  /**
   * Write 64-bit float
   */
  writeFloat64(value: number): this {
    this.ensureCapacity(8);
    this.view.setFloat64(this.offset, value, this.littleEndian);
    this.offset += 8;
    return this;
  }

  /**
   * Write BigInt64
   */
  writeBigInt64(value: bigint): this {
    this.ensureCapacity(8);
    this.view.setBigInt64(this.offset, value, this.littleEndian);
    this.offset += 8;
    return this;
  }

  /**
   * Write BigUint64
   */
  writeBigUint64(value: bigint): this {
    this.ensureCapacity(8);
    this.view.setBigUint64(this.offset, value, this.littleEndian);
    this.offset += 8;
    return this;
  }

  /**
   * Write bytes
   */
  writeBytes(data: BufferLike): this {
    const bytes = toUint8Array(data);
    this.ensureCapacity(bytes.length);
    this.currentChunk.set(bytes, this.offset);
    this.offset += bytes.length;
    return this;
  }

  /**
   * Write null-terminated string
   */
  writeCString(value: string): this {
    this.writeBytes(new TextEncoder().encode(value));
    this.writeUint8(0);
    return this;
  }

  /**
   * Write fixed-length string (padded with zeros)
   */
  writeString(value: string, length: number): this {
    const bytes = new TextEncoder().encode(value);
    const padded = new Uint8Array(length);
    padded.set(bytes.slice(0, length));
    this.writeBytes(padded);
    return this;
  }

  /**
   * Write length-prefixed string (uint8 length)
   */
  writePascalString(value: string): this {
    const bytes = new TextEncoder().encode(value);
    this.writeUint8(Math.min(bytes.length, 255));
    this.writeBytes(bytes.slice(0, 255));
    return this;
  }

  /**
   * Get the buffer
   */
  toBuffer(): Uint8Array {
    this.flush();
    return concat(...this.chunks);
  }
}

// ============================================================================
// Bit Manipulation
// ============================================================================

/**
 * BitSet for efficient boolean operations
 */
export class BitSet {
  private data: Uint32Array;
  private length: number;

  constructor(size: number) {
    this.length = size;
    this.data = new Uint32Array(Math.ceil(size / 32));
  }

  /**
   * Get bit at index
   */
  get(index: number): boolean {
    if (index < 0 || index >= this.length) {
      throw new RangeError('Index out of bounds');
    }
    const word = Math.floor(index / 32);
    const bit = index % 32;
    return (this.data[word] & (1 << bit)) !== 0;
  }

  /**
   * Set bit at index
   */
  set(index: number, value = true): void {
    if (index < 0 || index >= this.length) {
      throw new RangeError('Index out of bounds');
    }
    const word = Math.floor(index / 32);
    const bit = index % 32;
    if (value) {
      this.data[word] |= 1 << bit;
    } else {
      this.data[word] &= ~(1 << bit);
    }
  }

  /**
   * Clear bit at index
   */
  clear(index: number): void {
    this.set(index, false);
  }

  /**
   * Toggle bit at index
   */
  toggle(index: number): void {
    this.set(index, !this.get(index));
  }

  /**
   * Clear all bits
   */
  clearAll(): void {
    this.data.fill(0);
  }

  /**
   * Set all bits
   */
  setAll(): void {
    this.data.fill(0xffffffff);
    // Clear excess bits in the last word
    const excess = this.length % 32;
    if (excess > 0) {
      this.data[this.data.length - 1] &= (1 << excess) - 1;
    }
  }

  /**
   * Count set bits
   */
  count(): number {
    let count = 0;
    for (let i = 0; i < this.data.length; i++) {
      let n = this.data[i];
      // Brian Kernighan's algorithm
      while (n) {
        n &= n - 1;
        count++;
      }
    }
    return count;
  }

  /**
   * Check if any bit is set
   */
  any(): boolean {
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i] !== 0) return true;
    }
    return false;
  }

  /**
   * Check if all bits are set
   */
  all(): boolean {
    return this.count() === this.length;
  }

  /**
   * Bitwise AND with another BitSet
   */
  and(other: BitSet): BitSet {
    const result = new BitSet(Math.min(this.length, other.length));
    for (let i = 0; i < result.data.length; i++) {
      result.data[i] = (this.data[i] || 0) & (other.data[i] || 0);
    }
    return result;
  }

  /**
   * Bitwise OR with another BitSet
   */
  or(other: BitSet): BitSet {
    const result = new BitSet(Math.max(this.length, other.length));
    for (let i = 0; i < result.data.length; i++) {
      result.data[i] = (this.data[i] || 0) | (other.data[i] || 0);
    }
    return result;
  }

  /**
   * Bitwise XOR with another BitSet
   */
  xor(other: BitSet): BitSet {
    const result = new BitSet(Math.max(this.length, other.length));
    for (let i = 0; i < result.data.length; i++) {
      result.data[i] = (this.data[i] || 0) ^ (other.data[i] || 0);
    }
    return result;
  }

  /**
   * Bitwise NOT
   */
  not(): BitSet {
    const result = new BitSet(this.length);
    for (let i = 0; i < this.data.length; i++) {
      result.data[i] = ~this.data[i];
    }
    // Clear excess bits
    const excess = this.length % 32;
    if (excess > 0) {
      result.data[result.data.length - 1] &= (1 << excess) - 1;
    }
    return result;
  }

  /**
   * Get size
   */
  get size(): number {
    return this.length;
  }

  /**
   * Convert to array of indices
   */
  toArray(): number[] {
    const indices: number[] = [];
    for (let i = 0; i < this.length; i++) {
      if (this.get(i)) indices.push(i);
    }
    return indices;
  }
}

// ============================================================================
// Bit Utilities
// ============================================================================

/**
 * Get bit at position in number
 */
export function getBit(n: number, position: number): boolean {
  return ((n >> position) & 1) === 1;
}

/**
 * Set bit at position
 */
export function setBit(n: number, position: number): number {
  return n | (1 << position);
}

/**
 * Clear bit at position
 */
export function clearBit(n: number, position: number): number {
  return n & ~(1 << position);
}

/**
 * Toggle bit at position
 */
export function toggleBit(n: number, position: number): number {
  return n ^ (1 << position);
}

/**
 * Count set bits (population count)
 */
export function popCount(n: number): number {
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return (((n + (n >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
}

/**
 * Get highest set bit position (-1 if 0)
 */
export function highestBit(n: number): number {
  if (n === 0) return -1;
  return 31 - Math.clz32(n);
}

/**
 * Get lowest set bit position (-1 if 0)
 */
export function lowestBit(n: number): number {
  if (n === 0) return -1;
  return 31 - Math.clz32(n & -n);
}

/**
 * Check if number is power of 2
 */
export function isPowerOf2(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Get next power of 2
 */
export function nextPowerOf2(n: number): number {
  if (n <= 0) return 1;
  n--;
  n |= n >> 1;
  n |= n >> 2;
  n |= n >> 4;
  n |= n >> 8;
  n |= n >> 16;
  return n + 1;
}

/**
 * Reverse bits in a 32-bit number
 */
export function reverseBits(n: number): number {
  n = ((n & 0x55555555) << 1) | ((n >> 1) & 0x55555555);
  n = ((n & 0x33333333) << 2) | ((n >> 2) & 0x33333333);
  n = ((n & 0x0f0f0f0f) << 4) | ((n >> 4) & 0x0f0f0f0f);
  n = ((n & 0x00ff00ff) << 8) | ((n >> 8) & 0x00ff00ff);
  return ((n << 16) | (n >>> 16)) >>> 0;
}

/**
 * Rotate bits left
 */
export function rotateLeft(
  n: number,
  bits: number,
  width: number = 32
): number {
  const mask = width === 32 ? -1 : (1 << width) - 1;
  n &= mask;
  return ((n << bits) | (n >>> (width - bits))) & mask;
}

/**
 * Rotate bits right
 */
export function rotateRight(
  n: number,
  bits: number,
  width: number = 32
): number {
  const mask = width === 32 ? -1 : (1 << width) - 1;
  n &= mask;
  return ((n >>> bits) | (n << (width - bits))) & mask;
}

// ============================================================================
// Checksum Utilities
// ============================================================================

/**
 * Calculate CRC32
 */
export function crc32(data: BufferLike): number {
  const bytes = toUint8Array(data);

  // Build CRC table
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Calculate Adler-32
 */
export function adler32(data: BufferLike): number {
  const bytes = toUint8Array(data);
  const MOD_ADLER = 65521;
  let a = 1;
  let b = 0;

  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % MOD_ADLER;
    b = (b + a) % MOD_ADLER;
  }

  return ((b << 16) | a) >>> 0;
}

/**
 * Calculate simple checksum (XOR)
 */
export function xorChecksum(data: BufferLike): number {
  const bytes = toUint8Array(data);
  let checksum = 0;
  for (let i = 0; i < bytes.length; i++) {
    checksum ^= bytes[i];
  }
  return checksum;
}

/**
 * Calculate simple checksum (sum modulo 256)
 */
export function sumChecksum(data: BufferLike): number {
  const bytes = toUint8Array(data);
  let sum = 0;
  for (let i = 0; i < bytes.length; i++) {
    sum = (sum + bytes[i]) & 0xff;
  }
  return sum;
}

// ============================================================================
// Export Default
// ============================================================================

export const binary = {
  // Conversion
  toUint8Array,
  toString,
  toHex,
  fromHex,
  toBase64,
  fromBase64,
  toBase64Url,
  fromBase64Url,

  // Operations
  concat,
  compare,
  equals,
  slice,
  fill,
  zeros,
  random,
  copy,
  indexOf,
  split,

  // Classes
  BinaryReader,
  BinaryWriter,
  BitSet,

  // Bit manipulation
  getBit,
  setBit,
  clearBit,
  toggleBit,
  popCount,
  highestBit,
  lowestBit,
  isPowerOf2,
  nextPowerOf2,
  reverseBits,
  rotateLeft,
  rotateRight,

  // Checksums
  crc32,
  adler32,
  xorChecksum,
  sumChecksum,
};
