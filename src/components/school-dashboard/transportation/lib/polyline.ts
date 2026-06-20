// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Standard encoded-polyline decoder (Google/Mapbox algorithm, precision 5).
// Pure — used server-side to turn Trip.polylineEncoded into [lat, lng] pairs for
// the live map, avoiding a client-side decode dependency.

export function decodePolyline(
  str: string,
  precision = 5
): Array<[number, number]> {
  let index = 0
  let lat = 0
  let lng = 0
  const coordinates: Array<[number, number]> = []
  const factor = Math.pow(10, precision)

  while (index < str.length) {
    let result = 1
    let shift = 0
    let b: number
    do {
      b = str.charCodeAt(index++) - 63 - 1
      result += b << shift
      shift += 5
    } while (b >= 0x1f)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    result = 1
    shift = 0
    do {
      b = str.charCodeAt(index++) - 63 - 1
      result += b << shift
      shift += 5
    } while (b >= 0x1f)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    coordinates.push([lat / factor, lng / factor])
  }

  return coordinates
}
