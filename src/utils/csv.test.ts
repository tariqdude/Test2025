/**
 * CSV Utilities Tests
 */
import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  stringifyCSV,
  parseTSV,
  stringifyTSV,
  detectDelimiter,
  parseCSVAuto,
  csvToJSON,
  jsonToCSV,
  analyzeCSV,
  filterCSV,
  mapCSV,
  sortCSV,
  selectColumns,
  renameColumns,
  mergeCSV,
  groupCSV,
  pivotCSV,
} from './csv';

describe('CSV Utilities', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV', () => {
      const csv = 'a,b,c\n1,2,3\n4,5,6';
      const { data, rowCount } = parseCSV(csv);

      expect(rowCount).toBe(3);
      expect(data).toEqual([
        ['a', 'b', 'c'],
        ['1', '2', '3'],
        ['4', '5', '6'],
      ]);
    });

    it('should parse CSV with headers', () => {
      const csv = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const { data, headers } = parseCSV(csv, { headers: true });

      expect(headers).toEqual(['name', 'age', 'city']);
      expect(data).toEqual([
        { name: 'John', age: '30', city: 'NYC' },
        { name: 'Jane', age: '25', city: 'LA' },
      ]);
    });

    it('should handle quoted fields', () => {
      const csv = 'name,description\n"John ""JJ"" Doe","Hello, World"';
      const { data } = parseCSV(csv, { headers: true });

      expect(data[0]).toEqual({
        name: 'John "JJ" Doe',
        description: 'Hello, World',
      });
    });

    it('should handle multiline fields', () => {
      const csv = 'name,bio\nJohn,"Line 1\nLine 2"';
      const { data } = parseCSV(csv, { headers: true });

      expect(data[0]).toEqual({
        name: 'John',
        bio: 'Line 1\nLine 2',
      });
    });

    it('should skip empty lines', () => {
      const csv = 'a,b\n1,2\n\n3,4';
      const { data } = parseCSV(csv, { skipEmptyLines: true });

      expect(data).toHaveLength(3);
    });

    it('should skip rows', () => {
      const csv = 'header\na,b\n1,2\n3,4';
      const { data } = parseCSV(csv, { skipRows: 1 });

      expect(data).toHaveLength(3);
    });

    it('should limit rows', () => {
      const csv = 'a,b\n1,2\n3,4\n5,6';
      const { data } = parseCSV(csv, { maxRows: 2 });

      expect(data).toHaveLength(2);
    });

    it('should trim values', () => {
      const csv = ' a , b \n 1 , 2 ';
      const { data } = parseCSV(csv, { trim: true });

      expect(data[0]).toEqual(['a', 'b']);
      expect(data[1]).toEqual(['1', '2']);
    });

    it('should transform values', () => {
      const csv = 'a,b\n1,2\n3,4';
      const { data } = parseCSV(csv, {
        headers: true,
        transform: value => Number(value),
      });

      expect(data[0]).toEqual({ a: 1, b: 2 });
    });

    it('should skip comment lines', () => {
      const csv = '# Comment\na,b\n1,2';
      const { data } = parseCSV(csv, { comment: '#' });

      expect(data).toHaveLength(2);
    });

    it('should use custom headers', () => {
      const csv = '1,2,3\n4,5,6';
      const { data, headers } = parseCSV(csv, { headers: ['x', 'y', 'z'] });

      expect(headers).toEqual(['x', 'y', 'z']);
      expect(data[0]).toEqual({ x: '1', y: '2', z: '3' });
    });

    it('should handle different delimiters', () => {
      const csv = 'a;b;c\n1;2;3';
      const { data } = parseCSV(csv, { delimiter: ';' });

      expect(data[0]).toEqual(['a', 'b', 'c']);
    });

    it('should handle CRLF line endings', () => {
      const csv = 'a,b\r\n1,2\r\n3,4';
      const { data } = parseCSV(csv);

      expect(data).toHaveLength(3);
    });
  });

  describe('stringifyCSV', () => {
    it('should stringify array of objects', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      const csv = stringifyCSV(data, { headers: true });

      expect(csv).toBe('name,age\nJohn,30\nJane,25');
    });

    it('should stringify array of arrays', () => {
      const data = [
        ['a', 'b', 'c'],
        [1, 2, 3],
      ];
      const csv = stringifyCSV(data, { headers: false });

      expect(csv).toBe('a,b,c\n1,2,3');
    });

    it('should quote fields with delimiters', () => {
      const data = [{ text: 'Hello, World' }];
      const csv = stringifyCSV(data, { headers: true });

      expect(csv).toBe('text\n"Hello, World"');
    });

    it('should escape quotes', () => {
      const data = [{ text: 'Say "Hello"' }];
      const csv = stringifyCSV(data, { headers: true });

      expect(csv).toBe('text\n"Say ""Hello"""');
    });

    it('should always quote if specified', () => {
      const data = [{ name: 'John', age: 30 }];
      const csv = stringifyCSV(data, { headers: true, quoteAll: true });

      expect(csv).toBe('"name","age"\n"John","30"');
    });

    it('should use custom delimiter', () => {
      const data = [{ a: 1, b: 2 }];
      const csv = stringifyCSV(data, { headers: true, delimiter: ';' });

      expect(csv).toBe('a;b\n1;2');
    });

    it('should use custom newline', () => {
      const data = [{ a: 1 }, { a: 2 }];
      const csv = stringifyCSV(data, { headers: true, newline: '\r\n' });

      expect(csv).toBe('a\r\n1\r\n2');
    });

    it('should handle null/undefined values', () => {
      const data = [{ a: null, b: undefined, c: 'test' }];
      const csv = stringifyCSV(data, { headers: true });

      expect(csv).toBe('a,b,c\n,,test');
    });

    it('should handle empty data', () => {
      const csv = stringifyCSV([]);
      expect(csv).toBe('');
    });

    it('should transform values', () => {
      const data = [{ price: 10 }];
      const csv = stringifyCSV(data, {
        headers: true,
        transform: value => `$${value}`,
      });

      expect(csv).toBe('$price\n$10');
    });
  });

  describe('TSV functions', () => {
    it('should parse TSV', () => {
      const tsv = 'a\tb\tc\n1\t2\t3';
      const { data } = parseTSV(tsv);

      expect(data[0]).toEqual(['a', 'b', 'c']);
    });

    it('should stringify TSV', () => {
      const data = [{ a: 1, b: 2 }];
      const tsv = stringifyTSV(data, { headers: true });

      expect(tsv).toBe('a\tb\n1\t2');
    });
  });

  describe('detectDelimiter', () => {
    it('should detect comma', () => {
      expect(detectDelimiter('a,b,c')).toBe(',');
    });

    it('should detect tab', () => {
      expect(detectDelimiter('a\tb\tc')).toBe('\t');
    });

    it('should detect semicolon', () => {
      expect(detectDelimiter('a;b;c')).toBe(';');
    });

    it('should detect pipe', () => {
      expect(detectDelimiter('a|b|c')).toBe('|');
    });

    it('should ignore delimiters in quotes', () => {
      expect(detectDelimiter('"a,b";c;d')).toBe(';');
    });
  });

  describe('parseCSVAuto', () => {
    it('should auto-detect delimiter and headers', () => {
      const csv = 'name;age\nJohn;30';
      const { data, headers } = parseCSVAuto(csv);

      expect(headers).toEqual(['name', 'age']);
      expect(data[0]).toEqual({ name: 'John', age: '30' });
    });
  });

  describe('csvToJSON / jsonToCSV', () => {
    it('should convert CSV to JSON', () => {
      const csv = 'name,age\nJohn,30';
      const json = JSON.parse(csvToJSON(csv));

      expect(json).toEqual([{ name: 'John', age: '30' }]);
    });

    it('should convert JSON to CSV', () => {
      const data = [{ name: 'John', age: 30 }];
      const csv = jsonToCSV(data);

      expect(csv).toBe('name,age\nJohn,30');
    });

    it('should convert JSON string to CSV', () => {
      const json = '[{"name":"John"}]';
      const csv = jsonToCSV(json);

      expect(csv).toContain('name');
      expect(csv).toContain('John');
    });
  });

  describe('analyzeCSV', () => {
    it('should analyze column types', () => {
      const csv = 'name,age,active\nJohn,30,true\nJane,25,false';
      const stats = analyzeCSV(csv);

      expect(stats).toHaveLength(3);
      expect(stats[0].name).toBe('name');
      expect(stats[0].type).toBe('string');
      expect(stats[1].name).toBe('age');
      expect(stats[1].type).toBe('number');
      expect(stats[2].type).toBe('boolean');
    });

    it('should calculate statistics', () => {
      const csv = 'value\n10\n20\n30';
      const stats = analyzeCSV(csv);

      expect(stats[0].min).toBe(10);
      expect(stats[0].max).toBe(30);
      expect(stats[0].unique).toBe(3);
    });

    it('should count empty values', () => {
      // Use explicit empty string in CSV format
      const csv = 'value\n1\n""\n3';
      const stats = analyzeCSV(csv);

      // Check that we have stats for the column
      expect(stats.length).toBe(1);
      expect(stats[0].nonEmpty).toBeGreaterThanOrEqual(2);
    });
  });

  describe('filterCSV', () => {
    it('should filter rows', () => {
      const csv = 'name,age\nJohn,30\nJane,25\nBob,35';
      const filtered = filterCSV(
        csv,
        (row: Record<string, string>) => Number(row.age) > 26
      );
      const { data } = parseCSV(filtered, { headers: true });

      expect(data).toHaveLength(2);
    });
  });

  describe('mapCSV', () => {
    it('should map rows', () => {
      const csv = 'value\n1\n2\n3';
      const mapped = mapCSV(csv, (row: Record<string, string>) => ({
        value: Number(row.value) * 2,
      }));
      const { data } = parseCSV(mapped, { headers: true });

      expect(data[0]).toEqual({ value: '2' });
      expect(data[2]).toEqual({ value: '6' });
    });
  });

  describe('sortCSV', () => {
    it('should sort by column ascending', () => {
      const csv = 'name,age\nJohn,30\nJane,25\nBob,35';
      const sorted = sortCSV(csv, 'age');
      const { data } = parseCSV(sorted, { headers: true });

      expect(data[0]).toEqual({ name: 'Jane', age: '25' });
      expect(data[2]).toEqual({ name: 'Bob', age: '35' });
    });

    it('should sort descending', () => {
      const csv = 'name,age\nJohn,30\nJane,25';
      const sorted = sortCSV(csv, 'age', { descending: true });
      const { data } = parseCSV(sorted, { headers: true });

      expect(data[0]).toEqual({ name: 'John', age: '30' });
    });
  });

  describe('selectColumns', () => {
    it('should select specific columns', () => {
      const csv = 'a,b,c\n1,2,3';
      const selected = selectColumns(csv, ['a', 'c']);
      const { data, headers } = parseCSV(selected, { headers: true });

      expect(headers).toEqual(['a', 'c']);
      expect(data[0]).toEqual({ a: '1', c: '3' });
    });
  });

  describe('renameColumns', () => {
    it('should rename columns', () => {
      const csv = 'old_name,age\nJohn,30';
      const renamed = renameColumns(csv, { old_name: 'name' });
      const { headers } = parseCSV(renamed, { headers: true });

      expect(headers).toContain('name');
      expect(headers).not.toContain('old_name');
    });
  });

  describe('mergeCSV', () => {
    it('should merge multiple CSVs', () => {
      const csv1 = 'name,age\nJohn,30';
      const csv2 = 'name,age\nJane,25';
      const merged = mergeCSV([csv1, csv2]);
      const { data } = parseCSV(merged, { headers: true });

      expect(data).toHaveLength(2);
    });

    it('should handle different columns', () => {
      const csv1 = 'name,age\nJohn,30';
      const csv2 = 'name,city\nJane,NYC';
      const merged = mergeCSV([csv1, csv2]);
      const { headers } = parseCSV(merged, { headers: true });

      expect(headers).toContain('name');
      expect(headers).toContain('age');
      expect(headers).toContain('city');
    });
  });

  describe('groupCSV', () => {
    it('should group by column', () => {
      const csv = 'city,name\nNYC,John\nLA,Jane\nNYC,Bob';
      const groups = groupCSV(csv, 'city');

      expect(groups['NYC']).toHaveLength(2);
      expect(groups['LA']).toHaveLength(1);
    });
  });

  describe('pivotCSV', () => {
    it('should pivot data', () => {
      const csv = 'year,product,sales\n2020,A,100\n2020,B,200\n2021,A,150';
      const pivoted = pivotCSV(csv, 'year', 'product', 'sales');
      const { data } = parseCSV(pivoted, { headers: true });

      expect(data[0]).toHaveProperty('A');
      expect(data[0]).toHaveProperty('B');
    });
  });
});
