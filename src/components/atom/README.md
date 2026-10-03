# Atoms

Level-2 components: compositions of two or more shadcn/ui primitives, reused across blocks
(`page-header.tsx`, `blur-image.tsx`, `phone-input.tsx`, `toast.tsx`, …). One file per atom; the
barrel is `index.ts`. This README records the atoms that carry real behaviour. Purely
presentational ones are described by their own file.

## Location picker: `mapbox-location-picker.tsx` + `school-geo.tsx`

Every address in the app goes through this one component:

- onboarding and school settings (`onboarding/location/map-form.tsx`)
- the student and teacher add wizards
- the public application's location step
- transportation stops, profiles and hazards

It replaces separate country, city and district fields with a single search field, the user's current location, and a map.

| Piece        | Where                                                        | Job                                                                                                      |
| ------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Picker       | `atom/mapbox-location-picker.tsx`                            | cmdk search, map, draggable pin, GPS, editable address line                                              |
| Geocoding    | `lib/mapbox.ts`                                              | Mapbox Geocoding v6: `suggestPlaces` (forward) and `reverseGeocode`                                      |
| Start view   | `lib/map-bias.ts`                                            | `resolveMapBias`: saved pin → school → school's country → Khartoum. `isValidCoord` rejects `0,0`         |
| School point | `atom/school-geo.tsx` + `lib/school-geo.ts`                  | `SchoolGeoProvider` in `app/[lang]/s/[subdomain]/layout.tsx` (an unawaited promise) and `useSchoolGeo()` |
| Hooks        | `hooks/use-mapbox-search.ts`, `hooks/use-reverse-geocode.ts` | debounced, abortable search; reverse lookup that drops stale answers                                     |
| Strings      | `school.locationPicker` in `school-{en,ar}.json`             | the dictionary wins over the `labels`/`placeholder` props (now fallbacks)                                |

**Props** (unchanged contract):

- `value`, `onChange(LocationResult)`.
- New:
  - `showSchool`: off on the school's own location form.
  - `school`: a point hint where there is no tenant context, i.e. onboarding.
  - `bias`: an override.

### Decisions (2026-10-04)

- **Search is biased, not swapped.** v6 with `country` set to the school's country and `proximity` set to the school, with one worldwide retry when the country has no match.
  - Measured on Khartoum queries, the Search Box API returned identical results under the same filter, so v6 stays (it's on the existing free tier).
  - Without the bias, "الرياض" from a Khartoum school returned Saudi Arabia.
- **Arabic needs the RTL plugin armed before every map** (`ensureRtlTextPlugin`). mapbox-gl sets the GLOBAL plugin status to `error` whenever a map unmounts mid-load ("Actor removed"). After that, every later map draws Arabic as reversed, disconnected letters. `setRTLTextPlugin(url, callback, deferred)`: the 2nd argument is a callback.
- **Label language** comes from the `language` option and `map.setLanguage()`. Standard style's `setConfigProperty("basemap","language")` is a silent no-op.
- **The camera moves before the network.** Search select, GPS and map taps fly at once (`jumpTo` under reduced motion), and the address follows when reverse geocoding answers. There is one persistent pin, moved with `setLngLat`. Its drop animation is on the INNER element, because Mapbox positions the marker element with a transform.
- **The address line is editable** for house numbers and landmarks. Sudan has thin street data but rich block data ("كافوري مربع 9"). After a manual edit, a small drag keeps the typed words.
- **Pins persist** in `Float` `latitude`/`longitude` on `Student`, `Teacher` and `Application` (`School` keeps `Decimal`). They are Float because whole rows are spread into client components, and a Decimal can't cross the RSC boundary.
- **Touch devices** get `cooperativeGestures`: one finger scrolls the page, two move the map.
- **The Mapbox wordmark stays visible** (terms of service).

### Known limits

- Mapbox has no Arabic name for some Sudanese neighborhoods, so reverse results can mix scripts ("Al Busta South، أم درمان"). The address input follows the page direction rather than `dir="auto"` for this reason.
- POIs (schools, universities) are sparse in Sudan. Search is tuned to neighborhoods and blocks, and the pin carries the last few metres.
- Rows saved before 2026-10-04 have address text but no pin. Their map opens on the school.
