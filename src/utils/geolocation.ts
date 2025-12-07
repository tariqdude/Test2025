/**
 * Geolocation Utilities
 * @module utils/geolocation
 * @description Wrapper around the Geolocation API with utilities
 * for distance calculations, formatting, and location tracking.
 */

import { isBrowser } from './dom';

/**
 * Geographic coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

/**
 * Position result with timestamp
 */
export interface Position {
  coords: Coordinates;
  timestamp: number;
}

/**
 * Geolocation options
 */
export interface GeolocationOptions {
  /** Use high accuracy (GPS) */
  enableHighAccuracy?: boolean;
  /** Maximum age of cached position (ms) */
  maximumAge?: number;
  /** Timeout for getting position (ms) */
  timeout?: number;
}

/**
 * Check if geolocation is supported
 */
export function isGeolocationSupported(): boolean {
  return isBrowser() && 'geolocation' in navigator;
}

/**
 * Get current position
 * @param options - Geolocation options
 * @returns Promise with position
 * @example
 * const position = await getCurrentPosition();
 * console.log(position.coords.latitude, position.coords.longitude);
 */
export function getCurrentPosition(
  options: GeolocationOptions = {}
): Promise<Position> {
  if (!isGeolocationSupported()) {
    return Promise.reject(new Error('Geolocation not supported'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          },
          timestamp: position.timestamp,
        });
      },
      error => {
        reject(new Error(getGeolocationErrorMessage(error.code)));
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? false,
        maximumAge: options.maximumAge ?? 0,
        timeout: options.timeout ?? 10000,
      }
    );
  });
}

/**
 * Watch position changes
 * @param callback - Called on position change
 * @param options - Geolocation options
 * @returns Cleanup function
 * @example
 * const stopWatching = watchPosition(
 *   (position) => console.log('New position:', position),
 *   (error) => console.error('Error:', error),
 * );
 */
export function watchPosition(
  callback: (position: Position) => void,
  onError?: (error: Error) => void,
  options: GeolocationOptions = {}
): () => void {
  if (!isGeolocationSupported()) {
    onError?.(new Error('Geolocation not supported'));
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    position => {
      callback({
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        },
        timestamp: position.timestamp,
      });
    },
    error => {
      onError?.(new Error(getGeolocationErrorMessage(error.code)));
    },
    {
      enableHighAccuracy: options.enableHighAccuracy ?? false,
      maximumAge: options.maximumAge ?? 0,
      timeout: options.timeout ?? 10000,
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

/**
 * Get human-readable error message for geolocation error code
 */
function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Permission denied. Please allow location access.';
    case 2:
      return 'Position unavailable. Unable to determine location.';
    case 3:
      return 'Timeout. Location request took too long.';
    default:
      return 'Unknown geolocation error.';
  }
}

// ============================================================================
// Distance Calculations
// ============================================================================

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 - First coordinate
 * @param point2 - Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(
  point1: Pick<Coordinates, 'latitude' | 'longitude'>,
  point2: Pick<Coordinates, 'latitude' | 'longitude'>
): number {
  const R = 6371; // Earth's radius in km

  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate bearing between two points
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
  from: Pick<Coordinates, 'latitude' | 'longitude'>,
  to: Pick<Coordinates, 'latitude' | 'longitude'>
): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let bearing = toDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Get compass direction from bearing
 */
export function bearingToDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Calculate destination point given start, bearing, and distance
 */
export function calculateDestination(
  start: Pick<Coordinates, 'latitude' | 'longitude'>,
  bearing: number,
  distance: number
): Coordinates {
  const R = 6371; // Earth's radius in km

  const lat1 = toRadians(start.latitude);
  const lon1 = toRadians(start.longitude);
  const bearingRad = toRadians(bearing);
  const angularDistance = distance / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    latitude: toDegrees(lat2),
    longitude: toDegrees(lon2),
  };
}

/**
 * Check if a point is within a radius of another point
 */
export function isWithinRadius(
  center: Pick<Coordinates, 'latitude' | 'longitude'>,
  point: Pick<Coordinates, 'latitude' | 'longitude'>,
  radiusKm: number
): boolean {
  return calculateDistance(center, point) <= radiusKm;
}

/**
 * Find the center point of multiple coordinates
 */
export function calculateCenter(
  points: Array<Pick<Coordinates, 'latitude' | 'longitude'>>
): Coordinates {
  if (points.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  if (points.length === 1) {
    return { latitude: points[0].latitude, longitude: points[0].longitude };
  }

  let x = 0;
  let y = 0;
  let z = 0;

  for (const point of points) {
    const lat = toRadians(point.latitude);
    const lon = toRadians(point.longitude);

    x += Math.cos(lat) * Math.cos(lon);
    y += Math.cos(lat) * Math.sin(lon);
    z += Math.sin(lat);
  }

  const total = points.length;
  x /= total;
  y /= total;
  z /= total;

  const centralLon = Math.atan2(y, x);
  const centralLat = Math.atan2(z, Math.sqrt(x * x + y * y));

  return {
    latitude: toDegrees(centralLat),
    longitude: toDegrees(centralLon),
  };
}

/**
 * Calculate bounding box for a set of points
 */
export function calculateBoundingBox(
  points: Array<Pick<Coordinates, 'latitude' | 'longitude'>>
): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  if (points.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;

  for (const point of points) {
    if (point.latitude > north) north = point.latitude;
    if (point.latitude < south) south = point.latitude;
    if (point.longitude > east) east = point.longitude;
    if (point.longitude < west) west = point.longitude;
  }

  return { north, south, east, west };
}

// ============================================================================
// Formatting
// ============================================================================

/**
 * Format options for coordinates
 */
export interface CoordinateFormatOptions {
  format?: 'decimal' | 'dms' | 'dm';
  precision?: number;
}

/**
 * Format coordinates as string
 * @param coords - Coordinates to format
 * @param options - Format options
 * @example
 * formatCoordinates({ latitude: 40.7128, longitude: -74.0060 })
 * // "40.7128°N, 74.0060°W"
 *
 * formatCoordinates({ latitude: 40.7128, longitude: -74.0060 }, { format: 'dms' })
 * // "40°42'46"N, 74°0'22"W"
 */
export function formatCoordinates(
  coords: Pick<Coordinates, 'latitude' | 'longitude'>,
  options: CoordinateFormatOptions = {}
): string {
  const { format = 'decimal', precision = 4 } = options;

  const formatDecimal = (value: number, isLat: boolean): string => {
    const direction = isLat ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
    return `${Math.abs(value).toFixed(precision)}°${direction}`;
  };

  const formatDMS = (value: number, isLat: boolean): string => {
    const direction = isLat ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';

    const absValue = Math.abs(value);
    const degrees = Math.floor(absValue);
    const minutesDecimal = (absValue - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = (minutesDecimal - minutes) * 60;

    return `${degrees}°${minutes}'${seconds.toFixed(1)}"${direction}`;
  };

  const formatDM = (value: number, isLat: boolean): string => {
    const direction = isLat ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';

    const absValue = Math.abs(value);
    const degrees = Math.floor(absValue);
    const minutes = (absValue - degrees) * 60;

    return `${degrees}°${minutes.toFixed(3)}'${direction}`;
  };

  const formatFn =
    format === 'dms' ? formatDMS : format === 'dm' ? formatDM : formatDecimal;

  return `${formatFn(coords.latitude, true)}, ${formatFn(coords.longitude, false)}`;
}

/**
 * Format distance with appropriate units
 * @param distanceKm - Distance in kilometers
 * @param options - Format options
 */
export function formatDistance(
  distanceKm: number,
  options: {
    unit?: 'metric' | 'imperial';
    precision?: number;
  } = {}
): string {
  const { unit = 'metric', precision = 1 } = options;

  if (unit === 'imperial') {
    const miles = distanceKm * 0.621371;
    if (miles < 0.1) {
      const feet = miles * 5280;
      return `${feet.toFixed(0)} ft`;
    }
    return `${miles.toFixed(precision)} mi`;
  }

  if (distanceKm < 1) {
    const meters = distanceKm * 1000;
    return `${meters.toFixed(0)} m`;
  }

  return `${distanceKm.toFixed(precision)} km`;
}

/**
 * Format speed with appropriate units
 */
export function formatSpeed(
  speedMps: number | null | undefined,
  options: { unit?: 'metric' | 'imperial' } = {}
): string {
  if (speedMps == null) return 'N/A';

  const { unit = 'metric' } = options;

  if (unit === 'imperial') {
    const mph = speedMps * 2.23694;
    return `${mph.toFixed(1)} mph`;
  }

  const kmh = speedMps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

// ============================================================================
// Helpers
// ============================================================================

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Parse coordinates from various string formats
 * @param input - Coordinate string
 * @returns Parsed coordinates or null
 * @example
 * parseCoordinates("40.7128, -74.0060")
 * parseCoordinates("40°42'46\"N, 74°0'22\"W")
 */
export function parseCoordinates(
  input: string
): Pick<Coordinates, 'latitude' | 'longitude'> | null {
  // Try decimal format first: "40.7128, -74.0060"
  const decimalMatch = input.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);

  if (decimalMatch) {
    const lat = parseFloat(decimalMatch[1]);
    const lon = parseFloat(decimalMatch[2]);

    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { latitude: lat, longitude: lon };
    }
  }

  // Try DMS format: "40°42'46\"N, 74°0'22\"W"
  const dmsMatch = input.match(
    /(\d+)°(\d+)'([\d.]+)"?\s*([NSEW])[,\s]+(\d+)°(\d+)'([\d.]+)"?\s*([NSEW])/i
  );

  if (dmsMatch) {
    const lat =
      (parseInt(dmsMatch[1]) +
        parseInt(dmsMatch[2]) / 60 +
        parseFloat(dmsMatch[3]) / 3600) *
      (dmsMatch[4].toUpperCase() === 'S' ? -1 : 1);

    const lon =
      (parseInt(dmsMatch[5]) +
        parseInt(dmsMatch[6]) / 60 +
        parseFloat(dmsMatch[7]) / 3600) *
      (dmsMatch[8].toUpperCase() === 'W' ? -1 : 1);

    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { latitude: lat, longitude: lon };
    }
  }

  return null;
}

/**
 * Generate a Google Maps URL for coordinates
 */
export function getGoogleMapsUrl(
  coords: Pick<Coordinates, 'latitude' | 'longitude'>,
  options: { zoom?: number } = {}
): string {
  const { zoom = 15 } = options;
  return `https://www.google.com/maps/@${coords.latitude},${coords.longitude},${zoom}z`;
}

/**
 * Generate an Apple Maps URL for coordinates
 */
export function getAppleMapsUrl(
  coords: Pick<Coordinates, 'latitude' | 'longitude'>
): string {
  return `https://maps.apple.com/?ll=${coords.latitude},${coords.longitude}`;
}

/**
 * Generate an OpenStreetMap URL for coordinates
 */
export function getOpenStreetMapUrl(
  coords: Pick<Coordinates, 'latitude' | 'longitude'>,
  options: { zoom?: number } = {}
): string {
  const { zoom = 15 } = options;
  return `https://www.openstreetmap.org/?mlat=${coords.latitude}&mlon=${coords.longitude}#map=${zoom}/${coords.latitude}/${coords.longitude}`;
}
