// NOTE: This file previously imported Prisma enums. We are migrating
// onboarding to a school context, so keep this server-only and avoid
// importing it on the client. Client code should import from constants.client.
import { Amenity, Highlight } from './enums'
import { PropertyTypeOption, AmenityOption, HighlightOption, StepConfig } from './types'

// Host onboarding steps configuration
export const HOST_STEPS: StepConfig[] = [
  {
    id: 'about-place',
    title: 'Tell us about your place',
    subtitle: 'Share some basic info about your space',
    path: 'about-place',
    isRequired: true,
    order: 1
  },
  {
    id: 'structure',
    title: 'What type of place will guests have?',
    subtitle: 'Specify the privacy level',
    path: 'structure',
    isRequired: true,
    order: 2
  },
  {
    id: 'privacy-type',
    title: 'What type of place will guests have?',
    subtitle: 'Choose privacy type',
    path: 'privacy-type',
    isRequired: true,
    order: 3
  },
  {
    id: 'location',
    title: 'Where is your place located?',
    subtitle: 'Your address is only shared with guests after they book',
    path: 'location',
    isRequired: true,
    order: 4
  },
  {
    id: 'floor-plan',
    title: 'Share some basics about your space',
    subtitle: 'You can always change these later',
    path: 'floor-plan',
    isRequired: true,
    order: 5
  },
  {
    id: 'stand-out',
    title: 'Let guests know what your place has to offer',
    subtitle: 'Choose amenities',
    path: 'stand-out',
    isRequired: false,
    order: 6
  },
  {
    id: 'amenities',
    title: 'What amenities do you offer?',
    subtitle: 'You can add more amenities after you publish your listing',
    path: 'amenities',
    isRequired: false,
    order: 7
  },
  {
    id: 'photos',
    title: 'Add some photos of your place',
    subtitle: 'You need at least 5 photos to get started',
    path: 'photos',
    isRequired: true,
    order: 8
  },
  {
    id: 'title',
    title: 'Create your title',
    subtitle: 'Short titles work best',
    path: 'title',
    isRequired: true,
    order: 9
  },
  {
    id: 'description',
    title: 'Create your description',
    subtitle: 'Share what makes your place special',
    path: 'description',
    isRequired: true,
    order: 10
  },
  {
    id: 'instant-book',
    title: 'Instant Book',
    subtitle: 'Guests can book automatically',
    path: 'instant-book',
    isRequired: false,
    order: 11
  },
  {
    id: 'price',
    title: 'Set your price',
    subtitle: 'You can change it anytime',
    path: 'price',
    isRequired: true,
    order: 12
  },
  {
    id: 'discount',
    title: 'Add discounts',
    subtitle: 'Help your place stand out',
    path: 'discount',
    isRequired: false,
    order: 13
  },
  {
    id: 'legal',
    title: 'Legal',
    subtitle: 'Review important information',
    path: 'legal',
    isRequired: true,
    order: 14
  },
  {
    id: 'visibility',
    title: 'Publish your listing',
    subtitle: 'Choose how to publish',
    path: 'visibility',
    isRequired: true,
    order: 15
  },
  {
    id: 'finish-setup',
    title: 'Congratulations!',
    subtitle: 'Your listing is ready',
    path: 'finish-setup',
    isRequired: false,
    order: 16
  }
]

// Property type options
// Deprecated real-estate property types removed for school migration.
export const PROPERTY_TYPE_OPTIONS: PropertyTypeOption[] = []

// Amenity options by category
export const ESSENTIAL_AMENITIES: AmenityOption[] = [
  {
    id: Amenity.WiFi,
    title: 'WiFi',
    category: 'essential'
  },
  {
    id: Amenity.WasherDryer,
    title: 'Washer & Dryer',
    category: 'essential'
  },
  {
    id: Amenity.AirConditioning,
    title: 'Air conditioning',
    category: 'essential'
  },
  {
    id: Amenity.Parking,
    title: 'Free parking on premises',
    category: 'essential'
  }
]

export const FEATURE_AMENITIES: AmenityOption[] = [
  {
    id: Amenity.Pool,
    title: 'Pool',
    category: 'features'
  },
  {
    id: Amenity.Gym,
    title: 'Gym',
    category: 'features'
  },
  {
    id: Amenity.HardwoodFloors,
    title: 'Hardwood floors',
    category: 'features'
  },
  {
    id: Amenity.WalkInClosets,
    title: 'Walk-in closets',
    category: 'features'
  }
]

export const KITCHEN_AMENITIES: AmenityOption[] = [
  {
    id: Amenity.Dishwasher,
    title: 'Dishwasher',
    category: 'essential'
  },
  {
    id: Amenity.Microwave,
    title: 'Microwave',
    category: 'essential'
  },
  {
    id: Amenity.Refrigerator,
    title: 'Refrigerator',
    category: 'essential'
  }
]

export const SAFETY_AMENITIES: AmenityOption[] = [
  // Add safety amenities if any exist in your enum
]

// All amenities grouped
export const ALL_AMENITIES: AmenityOption[] = [
  ...ESSENTIAL_AMENITIES,
  ...FEATURE_AMENITIES,
  ...KITCHEN_AMENITIES,
  ...SAFETY_AMENITIES
]

// Highlight options
export const HIGHLIGHT_OPTIONS: HighlightOption[] = [
  {
    id: Highlight.HighSpeedInternetAccess,
    title: 'High-speed internet',
    description: 'Great for remote work'
  },
  {
    id: Highlight.WasherDryer,
    title: 'Washer & Dryer',
    description: 'In-unit laundry'
  },
  {
    id: Highlight.AirConditioning,
    title: 'Air conditioning',
    description: 'Stay cool and comfortable'
  },
  {
    id: Highlight.Heating,
    title: 'Heating',
    description: 'Stay warm and cozy'
  },
  {
    id: Highlight.SmokeFree,
    title: 'Smoke-free',
    description: 'No smoking allowed'
  },
  {
    id: Highlight.CableReady,
    title: 'Cable ready',
    description: 'Cable TV hookup available'
  },
  {
    id: Highlight.SatelliteTV,
    title: 'Satellite TV',
    description: 'Satellite television'
  },
  {
    id: Highlight.DoubleVanities,
    title: 'Double vanities',
    description: 'Two bathroom sinks'
  },
  {
    id: Highlight.TubShower,
    title: 'Tub/Shower',
    description: 'Bathtub and shower combo'
  },
  {
    id: Highlight.Intercom,
    title: 'Intercom',
    description: 'Building intercom system'
  },
  {
    id: Highlight.SprinklerSystem,
    title: 'Sprinkler system',
    description: 'Fire safety sprinklers'
  },
  {
    id: Highlight.RecentlyRenovated,
    title: 'Recently renovated',
    description: 'Updated and modernized'
  },
  {
    id: Highlight.CloseToTransit,
    title: 'Close to transit',
    description: 'Near public transportation'
  },
  {
    id: Highlight.GreatView,
    title: 'Great view',
    description: 'Beautiful scenery'
  },
  {
    id: Highlight.QuietNeighborhood,
    title: 'Quiet neighborhood',
    description: 'Peaceful and tranquil'
  }
]

// Privacy type options
export const PRIVACY_TYPES = [
  {
    id: 'entire_place',
    title: 'An entire place',
    description: 'Guests have the whole place to themselves'
  },
  {
    id: 'private_room',
    title: 'A private room',
    description: 'Guests have their own room in a home, plus access to shared spaces'
  },
  {
    id: 'shared_room',
    title: 'A shared room',
    description: 'Guests sleep in a room or common area that may be shared with you or others'
  }
]

// Step navigation mapping
export const STEP_NAVIGATION: Record<string, { next?: string; previous?: string }> = {
  'about-place': { next: 'structure' },
  'structure': { next: 'privacy-type', previous: 'about-place' },
  'privacy-type': { next: 'location', previous: 'structure' },
  'location': { next: 'floor-plan', previous: 'privacy-type' },
  'floor-plan': { next: 'stand-out', previous: 'location' },
  'stand-out': { next: 'amenities', previous: 'floor-plan' },
  'amenities': { next: 'photos', previous: 'stand-out' },
  'photos': { next: 'title', previous: 'amenities' },
  'title': { next: 'description', previous: 'photos' },
  'description': { next: 'instant-book', previous: 'title' },
  'instant-book': { next: 'price', previous: 'description' },
  'price': { next: 'discount', previous: 'instant-book' },
  'discount': { next: 'legal', previous: 'price' },
  'legal': { next: 'visibility', previous: 'discount' },
  'visibility': { next: 'finish-setup', previous: 'legal' },
  'finish-setup': { previous: 'visibility' }
}

// Form field limits
export const FORM_LIMITS = {
  TITLE_MAX_LENGTH: 50,
  TITLE_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 500,
  DESCRIPTION_MIN_LENGTH: 50,
  MIN_PHOTOS: 5,
  MAX_PHOTOS: 30,
  MIN_PRICE: 10,
  MAX_PRICE: 10000,
  MIN_BEDROOMS: 0,
  MAX_BEDROOMS: 50,
  MIN_BATHROOMS: 0.5,
  MAX_BATHROOMS: 50,
  MIN_GUESTS: 1,
  MAX_GUESTS: 50
} as const

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  TITLE_TOO_SHORT: `Title must be at least ${FORM_LIMITS.TITLE_MIN_LENGTH} characters`,
  TITLE_TOO_LONG: `Title must be no more than ${FORM_LIMITS.TITLE_MAX_LENGTH} characters`,
  DESCRIPTION_TOO_SHORT: `Description must be at least ${FORM_LIMITS.DESCRIPTION_MIN_LENGTH} characters`,
  DESCRIPTION_TOO_LONG: `Description must be no more than ${FORM_LIMITS.DESCRIPTION_MAX_LENGTH} characters`,
  NOT_ENOUGH_PHOTOS: `You need at least ${FORM_LIMITS.MIN_PHOTOS} photos`,
  TOO_MANY_PHOTOS: `You can upload a maximum of ${FORM_LIMITS.MAX_PHOTOS} photos`,
  PRICE_TOO_LOW: `Price must be at least $${FORM_LIMITS.MIN_PRICE}`,
  PRICE_TOO_HIGH: `Price cannot exceed $${FORM_LIMITS.MAX_PRICE}`,
  INVALID_NUMBER: 'Please enter a valid number'
} as const 