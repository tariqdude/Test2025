/**
 * Tests for geolocation utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isGeolocationSupported,
  getCurrentPosition,
  watchPosition,
  calculateDistance,
  calculateBearing,
  bearingToDirection,
  calculateDestination,
  isWithinRadius,
  calculateCenter,
  calculateBoundingBox,
  formatCoordinates,
  formatDistance,
  formatSpeed,
  parseCoordinates,
  getGoogleMapsUrl,
  getAppleMapsUrl,
  getOpenStreetMapUrl,
} from './geolocation';

describe('geolocation utilities', () => {
  describe('isGeolocationSupported', () => {
    it('should return true when geolocation is available', () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: { getCurrentPosition: vi.fn() },
        configurable: true,
      });

      expect(isGeolocationSupported()).toBe(true);
    });
  });

  describe('getCurrentPosition', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: vi.fn(),
          watchPosition: vi.fn(),
          clearWatch: vi.fn(),
        },
        configurable: true,
      });
    });

    it('should resolve with position', async () => {
      const mockCoords = {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON() {
          return this;
        },
      };
      const mockPosition = {
        coords: mockCoords,
        timestamp: Date.now(),
        toJSON() {
          return this;
        },
      } as GeolocationPosition;

      vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation(
        success => {
          success(mockPosition);
        }
      );

      const result = await getCurrentPosition();

      expect(result.coords.latitude).toBe(40.7128);
      expect(result.coords.longitude).toBe(-74.006);
    });

    it('should reject on error', async () => {
      vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation(
        (_success, error) => {
          error?.({
            code: 1,
            message: 'Permission denied',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          });
        }
      );

      await expect(getCurrentPosition()).rejects.toThrow('Permission denied');
    });
  });

  describe('watchPosition', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: vi.fn(),
          watchPosition: vi.fn().mockReturnValue(123),
          clearWatch: vi.fn(),
        },
        configurable: true,
      });
    });

    it('should return cleanup function', () => {
      const cleanup = watchPosition(() => {});
      expect(typeof cleanup).toBe('function');
    });

    it('should call clearWatch on cleanup', () => {
      const cleanup = watchPosition(() => {});
      cleanup();
      expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(123);
    });
  });

  describe('distance calculations', () => {
    describe('calculateDistance', () => {
      it('should calculate distance between two points', () => {
        const nyc = { latitude: 40.7128, longitude: -74.006 };
        const la = { latitude: 34.0522, longitude: -118.2437 };

        const distance = calculateDistance(nyc, la);

        // NYC to LA is approximately 3944 km
        expect(distance).toBeGreaterThan(3900);
        expect(distance).toBeLessThan(4000);
      });

      it('should return 0 for same point', () => {
        const point = { latitude: 40.7128, longitude: -74.006 };

        const distance = calculateDistance(point, point);

        expect(distance).toBe(0);
      });
    });

    describe('calculateBearing', () => {
      it('should calculate bearing between two points', () => {
        const from = { latitude: 40.7128, longitude: -74.006 };
        const to = { latitude: 41.8781, longitude: -87.6298 };

        const bearing = calculateBearing(from, to);

        expect(bearing).toBeGreaterThanOrEqual(0);
        expect(bearing).toBeLessThan(360);
      });
    });

    describe('bearingToDirection', () => {
      it('should return N for 0 degrees', () => {
        expect(bearingToDirection(0)).toBe('N');
      });

      it('should return E for 90 degrees', () => {
        expect(bearingToDirection(90)).toBe('E');
      });

      it('should return S for 180 degrees', () => {
        expect(bearingToDirection(180)).toBe('S');
      });

      it('should return W for 270 degrees', () => {
        expect(bearingToDirection(270)).toBe('W');
      });

      it('should return NE for 45 degrees', () => {
        expect(bearingToDirection(45)).toBe('NE');
      });
    });

    describe('calculateDestination', () => {
      it('should calculate destination point', () => {
        const start = { latitude: 40.7128, longitude: -74.006 };
        const bearing = 90; // East
        const distance = 100; // 100 km

        const destination = calculateDestination(start, bearing, distance);

        expect(destination.latitude).toBeCloseTo(40.7128, 0);
        expect(destination.longitude).toBeGreaterThan(start.longitude);
      });
    });

    describe('isWithinRadius', () => {
      it('should return true for point within radius', () => {
        const center = { latitude: 40.7128, longitude: -74.006 };
        const point = { latitude: 40.72, longitude: -74.01 };

        expect(isWithinRadius(center, point, 10)).toBe(true);
      });

      it('should return false for point outside radius', () => {
        const center = { latitude: 40.7128, longitude: -74.006 };
        const point = { latitude: 41.0, longitude: -75.0 };

        expect(isWithinRadius(center, point, 1)).toBe(false);
      });
    });

    describe('calculateCenter', () => {
      it('should calculate center of multiple points', () => {
        const points = [
          { latitude: 40, longitude: -74 },
          { latitude: 41, longitude: -75 },
          { latitude: 39, longitude: -73 },
        ];

        const center = calculateCenter(points);

        expect(center.latitude).toBeCloseTo(40, 0);
        expect(center.longitude).toBeCloseTo(-74, 0);
      });

      it('should return origin for empty array', () => {
        const center = calculateCenter([]);
        expect(center.latitude).toBe(0);
        expect(center.longitude).toBe(0);
      });

      it('should return same point for single point', () => {
        const point = { latitude: 40.7128, longitude: -74.006 };
        const center = calculateCenter([point]);
        expect(center.latitude).toBe(point.latitude);
        expect(center.longitude).toBe(point.longitude);
      });
    });

    describe('calculateBoundingBox', () => {
      it('should calculate bounding box', () => {
        const points = [
          { latitude: 40, longitude: -74 },
          { latitude: 41, longitude: -75 },
          { latitude: 39, longitude: -73 },
        ];

        const box = calculateBoundingBox(points);

        expect(box.north).toBe(41);
        expect(box.south).toBe(39);
        expect(box.east).toBe(-73);
        expect(box.west).toBe(-75);
      });
    });
  });

  describe('formatting', () => {
    describe('formatCoordinates', () => {
      it('should format in decimal format by default', () => {
        const coords = { latitude: 40.7128, longitude: -74.006 };
        const formatted = formatCoordinates(coords);

        expect(formatted).toContain('40.7128');
        expect(formatted).toContain('N');
        expect(formatted).toContain('W');
      });

      it('should format in DMS format', () => {
        const coords = { latitude: 40.7128, longitude: -74.006 };
        const formatted = formatCoordinates(coords, { format: 'dms' });

        expect(formatted).toContain('°');
        expect(formatted).toContain("'");
        expect(formatted).toContain('"');
      });
    });

    describe('formatDistance', () => {
      it('should format in metric by default', () => {
        expect(formatDistance(5)).toContain('km');
        expect(formatDistance(0.5)).toContain('m');
      });

      it('should format in imperial when specified', () => {
        expect(formatDistance(5, { unit: 'imperial' })).toContain('mi');
        expect(formatDistance(0.05, { unit: 'imperial' })).toContain('ft');
      });
    });

    describe('formatSpeed', () => {
      it('should format speed in km/h by default', () => {
        expect(formatSpeed(10)).toContain('km/h');
      });

      it('should format speed in mph when imperial', () => {
        expect(formatSpeed(10, { unit: 'imperial' })).toContain('mph');
      });

      it('should handle null speed', () => {
        expect(formatSpeed(null)).toBe('N/A');
      });
    });
  });

  describe('parsing', () => {
    describe('parseCoordinates', () => {
      it('should parse decimal format', () => {
        const result = parseCoordinates('40.7128, -74.006');

        expect(result).not.toBeNull();
        expect(result?.latitude).toBeCloseTo(40.7128);
        expect(result?.longitude).toBeCloseTo(-74.006);
      });

      it('should parse DMS format', () => {
        const result = parseCoordinates('40°42\'46"N, 74°0\'22"W');

        expect(result).not.toBeNull();
        expect(result?.latitude).toBeCloseTo(40.7128, 1);
        expect(result?.longitude).toBeCloseTo(-74.006, 1);
      });

      it('should return null for invalid input', () => {
        expect(parseCoordinates('invalid')).toBeNull();
        expect(parseCoordinates('999, 999')).toBeNull();
      });
    });
  });

  describe('map URLs', () => {
    const coords = { latitude: 40.7128, longitude: -74.006 };

    describe('getGoogleMapsUrl', () => {
      it('should generate Google Maps URL', () => {
        const url = getGoogleMapsUrl(coords);
        expect(url).toContain('google.com/maps');
        expect(url).toContain('40.7128');
        expect(url).toContain('-74.006');
      });
    });

    describe('getAppleMapsUrl', () => {
      it('should generate Apple Maps URL', () => {
        const url = getAppleMapsUrl(coords);
        expect(url).toContain('maps.apple.com');
        expect(url).toContain('40.7128');
        expect(url).toContain('-74.006');
      });
    });

    describe('getOpenStreetMapUrl', () => {
      it('should generate OpenStreetMap URL', () => {
        const url = getOpenStreetMapUrl(coords);
        expect(url).toContain('openstreetmap.org');
        expect(url).toContain('40.7128');
        expect(url).toContain('-74.006');
      });
    });
  });
});
