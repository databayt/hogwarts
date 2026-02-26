// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export interface LocationData {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  latitude?: number
  longitude?: number
}

export interface LocationFormData {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  latitude?: number
  longitude?: number
}

export interface GeocodingResult {
  latitude: number
  longitude: number
  formattedAddress: string
  city: string
  state: string
  country: string
  postalCode: string
}
