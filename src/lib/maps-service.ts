/**
 * Maps Service
 * Provides geocoding and location services for school addresses
 * Supports Google Maps, Mapbox, and OpenStreetMap
 */

import { logger } from '@/lib/logger';

// === TYPE DEFINITIONS ===

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface AddressComponents {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface GeocodingResult {
  success: boolean;
  coordinates?: Coordinates;
  formattedAddress?: string;
  addressComponents?: AddressComponents;
  placeId?: string;
  error?: string;
}

export interface LocationValidation {
  isValid: boolean;
  suggestions?: string[];
  confidence?: number;
}

export type MapsProvider = 'google' | 'mapbox' | 'openstreetmap';

// === CONFIGURATION ===

interface MapsConfig {
  provider: MapsProvider;
  apiKey?: string;
  region?: string;
  language?: string;
}

const config: MapsConfig = {
  provider: (process.env.NEXT_PUBLIC_MAPS_PROVIDER as MapsProvider) || 'openstreetmap',
  apiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY,
  region: process.env.NEXT_PUBLIC_MAPS_REGION || 'US',
  language: process.env.NEXT_PUBLIC_MAPS_LANGUAGE || 'en',
};

// === MAIN SERVICE CLASS ===

class MapsService {
  private provider: MapsProvider;
  private apiKey?: string;

  constructor(config: MapsConfig) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    
    if (this.provider !== 'openstreetmap' && !this.apiKey) {
      logger.warn('Maps API key not configured', { provider: this.provider });
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodingResult> {
    try {
      switch (this.provider) {
        case 'google':
          return await this.geocodeWithGoogle(address);
        case 'mapbox':
          return await this.geocodeWithMapbox(address);
        case 'openstreetmap':
          return await this.geocodeWithOSM(address);
        default:
          return {
            success: false,
            error: `Unsupported maps provider: ${this.provider}`
          };
      }
    } catch (error) {
      logger.error('Geocoding failed', error as Error, { address, provider: this.provider });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Geocoding failed'
      };
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(coordinates: Coordinates): Promise<GeocodingResult> {
    try {
      switch (this.provider) {
        case 'google':
          return await this.reverseGeocodeWithGoogle(coordinates);
        case 'mapbox':
          return await this.reverseGeocodeWithMapbox(coordinates);
        case 'openstreetmap':
          return await this.reverseGeocodeWithOSM(coordinates);
        default:
          return {
            success: false,
            error: `Unsupported maps provider: ${this.provider}`
          };
      }
    } catch (error) {
      logger.error('Reverse geocoding failed', error as Error, { coordinates, provider: this.provider });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reverse geocoding failed'
      };
    }
  }

  /**
   * Validate an address
   */
  async validateAddress(address: string): Promise<LocationValidation> {
    const result = await this.geocodeAddress(address);
    
    if (!result.success || !result.coordinates) {
      return {
        isValid: false,
        suggestions: [],
        confidence: 0
      };
    }

    // Calculate confidence based on address match
    const confidence = result.formattedAddress 
      ? this.calculateAddressConfidence(address, result.formattedAddress)
      : 0.5;

    return {
      isValid: confidence > 0.7,
      suggestions: result.formattedAddress ? [result.formattedAddress] : [],
      confidence
    };
  }

  // === GOOGLE MAPS IMPLEMENTATION ===

  private async geocodeWithGoogle(address: string): Promise<GeocodingResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Google Maps API key not configured. Set NEXT_PUBLIC_MAPS_API_KEY in your environment.'
      };
    }

    // NOTE: Uncomment and implement when Google Maps API is configured
    /*
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', address);
    url.searchParams.append('key', this.apiKey);
    url.searchParams.append('region', config.region || 'US');
    url.searchParams.append('language', config.language || 'en');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.length) {
      return {
        success: false,
        error: data.status === 'ZERO_RESULTS' 
          ? 'No results found for this address' 
          : `Google Maps error: ${data.status}`
      };
    }

    const result = data.results[0];
    const location = result.geometry.location;
    
    // Parse address components
    const components: AddressComponents = {};
    for (const component of result.address_components) {
      const types = component.types;
      if (types.includes('street_number') || types.includes('route')) {
        components.street = (components.street || '') + ' ' + component.long_name;
      } else if (types.includes('locality')) {
        components.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        components.state = component.short_name;
      } else if (types.includes('country')) {
        components.country = component.long_name;
      } else if (types.includes('postal_code')) {
        components.postalCode = component.long_name;
      }
    }

    return {
      success: true,
      coordinates: {
        latitude: location.lat,
        longitude: location.lng
      },
      formattedAddress: result.formatted_address,
      addressComponents: components,
      placeId: result.place_id
    };
    */

    return {
      success: false,
      error: 'Google Maps integration not yet implemented. Please configure API key and uncomment implementation.'
    };
  }

  private async reverseGeocodeWithGoogle(coordinates: Coordinates): Promise<GeocodingResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Google Maps API key not configured'
      };
    }

    // NOTE: Implement when Google Maps API is configured
    return {
      success: false,
      error: 'Google Maps reverse geocoding not yet implemented'
    };
  }

  // === MAPBOX IMPLEMENTATION ===

  private async geocodeWithMapbox(address: string): Promise<GeocodingResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Mapbox API key not configured. Set NEXT_PUBLIC_MAPS_API_KEY in your environment.'
      };
    }

    // NOTE: Uncomment and implement when Mapbox API is configured
    /*
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`);
    url.searchParams.append('access_token', this.apiKey);
    url.searchParams.append('limit', '1');
    url.searchParams.append('country', config.region || 'US');
    url.searchParams.append('language', config.language || 'en');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!data.features?.length) {
      return {
        success: false,
        error: 'No results found for this address'
      };
    }

    const feature = data.features[0];
    const [longitude, latitude] = feature.center;

    // Parse context for address components
    const components: AddressComponents = {};
    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith('postcode')) {
          components.postalCode = ctx.text;
        } else if (ctx.id.startsWith('place')) {
          components.city = ctx.text;
        } else if (ctx.id.startsWith('region')) {
          components.state = ctx.text;
        } else if (ctx.id.startsWith('country')) {
          components.country = ctx.text;
        }
      }
    }
    if (feature.properties?.address) {
      components.street = feature.properties.address;
    }

    return {
      success: true,
      coordinates: { latitude, longitude },
      formattedAddress: feature.place_name,
      addressComponents: components,
      placeId: feature.id
    };
    */

    return {
      success: false,
      error: 'Mapbox integration not yet implemented. Please configure API key and uncomment implementation.'
    };
  }

  private async reverseGeocodeWithMapbox(coordinates: Coordinates): Promise<GeocodingResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Mapbox API key not configured'
      };
    }

    // NOTE: Implement when Mapbox API is configured
    return {
      success: false,
      error: 'Mapbox reverse geocoding not yet implemented'
    };
  }

  // === OPENSTREETMAP IMPLEMENTATION (FREE, NO API KEY) ===

  private async geocodeWithOSM(address: string): Promise<GeocodingResult> {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.append('q', address);
      url.searchParams.append('format', 'json');
      url.searchParams.append('addressdetails', '1');
      url.searchParams.append('limit', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'SchoolOnboardingSystem/1.0' // Required by OSM
        }
      });
      
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        return {
          success: false,
          error: 'No results found for this address'
        };
      }

      const result = data[0];
      const components: AddressComponents = {};
      
      if (result.address) {
        components.street = result.address.road || result.address.street;
        components.city = result.address.city || result.address.town || result.address.village;
        components.state = result.address.state;
        components.country = result.address.country;
        components.postalCode = result.address.postcode;
      }

      return {
        success: true,
        coordinates: {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon)
        },
        formattedAddress: result.display_name,
        addressComponents: components,
        placeId: result.osm_id?.toString()
      };
    } catch (error) {
      logger.error('OpenStreetMap geocoding failed', error as Error);
      return {
        success: false,
        error: 'Failed to geocode address with OpenStreetMap'
      };
    }
  }

  private async reverseGeocodeWithOSM(coordinates: Coordinates): Promise<GeocodingResult> {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.append('lat', coordinates.latitude.toString());
      url.searchParams.append('lon', coordinates.longitude.toString());
      url.searchParams.append('format', 'json');
      url.searchParams.append('addressdetails', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'SchoolOnboardingSystem/1.0'
        }
      });
      
      const result = await response.json();

      if (!result || result.error) {
        return {
          success: false,
          error: result.error || 'No address found for these coordinates'
        };
      }

      const components: AddressComponents = {};
      if (result.address) {
        components.street = result.address.road || result.address.street;
        components.city = result.address.city || result.address.town || result.address.village;
        components.state = result.address.state;
        components.country = result.address.country;
        components.postalCode = result.address.postcode;
      }

      return {
        success: true,
        coordinates: {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon)
        },
        formattedAddress: result.display_name,
        addressComponents: components,
        placeId: result.osm_id?.toString()
      };
    } catch (error) {
      logger.error('OpenStreetMap reverse geocoding failed', error as Error);
      return {
        success: false,
        error: 'Failed to reverse geocode with OpenStreetMap'
      };
    }
  }

  // === HELPER METHODS ===

  private calculateAddressConfidence(input: string, matched: string): number {
    const inputLower = input.toLowerCase();
    const matchedLower = matched.toLowerCase();
    
    // Simple confidence calculation based on string similarity
    const inputParts = inputLower.split(/[\s,]+/);
    const matchedParts = matchedLower.split(/[\s,]+/);
    
    let matches = 0;
    for (const part of inputParts) {
      if (matchedParts.some(m => m.includes(part) || part.includes(m))) {
        matches++;
      }
    }
    
    return matches / Math.max(inputParts.length, 1);
  }
}

// === SINGLETON INSTANCE ===

export const mapsService = new MapsService(config);

// === UTILITY FUNCTIONS ===

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: Coordinates): string {
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}

/**
 * Calculate distance between two points (in kilometers)
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  
  return d;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}

// === REACT HOOKS (if using in client components) ===

export function useMapsUrl(address?: string, coordinates?: Coordinates): string {
  if (coordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return '';
}