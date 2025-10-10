import { ColorOption, StyleOption } from './types';

export const COLOR_OPTIONS: ColorOption[] = [
  { id: 'slate', name: 'Slate', color: '#0f172a', description: 'Professional and modern' },
  { id: 'blue', name: 'Blue', color: '#1d4ed8', description: 'Trustworthy and calm' },
  { id: 'green', name: 'Green', color: '#15803d', description: 'Growth and learning' },
  { id: 'yellow', name: 'Yellow', color: '#facc15', description: 'Energy and creativity' },
  { id: 'orange', name: 'Orange', color: '#ea580c', description: 'Friendly and confident' },
  { id: 'rose', name: 'Rose', color: '#e11d48', description: 'Passion and energy' },
  { id: 'purple', name: 'Purple', color: '#7e22ce', description: 'Wisdom and dignity' },
] as const;

export const RADIUS_OPTIONS: StyleOption[] = [
  { id: 'none', label: 'no', description: 'Sharp corners' },
  { id: 'sm', label: 'sm', description: 'Subtle rounding' },
  { id: 'md', label: 'md', description: 'Medium rounding' },
  { id: 'lg', label: 'lg', description: 'Soft rounding' },
] as const;

export const SHADOW_OPTIONS: StyleOption[] = [
  { id: 'none', label: 'no', description: 'No shadow' },
  { id: 'sm', label: 'sm', description: 'Subtle shadow' },
  { id: 'md', label: 'md', description: 'Medium shadow' },
  { id: 'lg', label: 'lg', description: 'Large shadow' },
] as const;

export const LOGO_LIMITS = {
  MAX_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/svg+xml'],
  MAX_DIMENSIONS: {
    width: 800,
    height: 800,
  },
} as const;

export const BRANDING_MESSAGES = {
  LOGO_TOO_LARGE: `Logo file must be smaller than ${LOGO_LIMITS.MAX_SIZE / (1024 * 1024)}MB`,
  INVALID_FILE_TYPE: 'Logo must be JPG, PNG, or SVG',
  DIMENSIONS_TOO_LARGE: `Logo dimensions cannot exceed ${LOGO_LIMITS.MAX_DIMENSIONS.width}x${LOGO_LIMITS.MAX_DIMENSIONS.height}px`,
  PRIMARY_COLOR_REQUIRED: 'Please select a primary color',
  INVALID_COLOR: 'Please select a valid color',
  INVALID_URL: 'Please enter a valid URL',
} as const;