import { z } from 'zod'

// Common timezones for schools, with emphasis on Sudan and MENA region
export const supportedTimezones = [
  'Africa/Khartoum', // Sudan (UTC+2)
  'Africa/Cairo', // Egypt (UTC+2)
  'Asia/Riyadh', // Saudi Arabia (UTC+3)
  'Asia/Dubai', // UAE (UTC+4)
  'Asia/Kuwait', // Kuwait (UTC+3)
  'Asia/Qatar', // Qatar (UTC+3)
  'Asia/Bahrain', // Bahrain (UTC+3)
  'Africa/Casablanca', // Morocco (UTC+1)
  'Africa/Tunis', // Tunisia (UTC+1)
  'Africa/Algiers', // Algeria (UTC+1)
  'Asia/Baghdad', // Iraq (UTC+3)
  'Asia/Damascus', // Syria (UTC+2)
  'Asia/Beirut', // Lebanon (UTC+2)
  'Asia/Amman', // Jordan (UTC+2)
  'Europe/London', // UK (UTC+0/+1)
  'Europe/Paris', // France (UTC+1/+2)
  'Europe/Berlin', // Germany (UTC+1/+2)
  'America/New_York', // Eastern US (UTC-5/-4)
  'America/Los_Angeles', // Pacific US (UTC-8/-7)
  'UTC', // UTC
] as const;

export type SupportedTimezone = typeof supportedTimezones[number];

// Timezone validation that checks against supported list
const timezoneSchema = z.string().refine(
  (tz) => supportedTimezones.includes(tz as SupportedTimezone),
  {
    message: 'Invalid timezone. Please select from the supported timezones list.',
  }
);

export const schoolSettingsSchema = z.object({
  name: z.string().min(1, 'School name is required'),
  timezone: timezoneSchema.default('Africa/Khartoum'),
  locale: z.enum(['ar', 'en']).default('ar'),
  logoUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
})

// Helper function to get timezone display name
export function getTimezoneDisplayName(timezone: string): string {
  const timezoneNames: Record<string, string> = {
    'Africa/Khartoum': 'Sudan (Khartoum) - UTC+2',
    'Africa/Cairo': 'Egypt (Cairo) - UTC+2',
    'Asia/Riyadh': 'Saudi Arabia (Riyadh) - UTC+3',
    'Asia/Dubai': 'UAE (Dubai) - UTC+4',
    'Asia/Kuwait': 'Kuwait - UTC+3',
    'Asia/Qatar': 'Qatar - UTC+3',
    'Asia/Bahrain': 'Bahrain - UTC+3',
    'Africa/Casablanca': 'Morocco (Casablanca) - UTC+1',
    'Africa/Tunis': 'Tunisia (Tunis) - UTC+1',
    'Africa/Algiers': 'Algeria (Algiers) - UTC+1',
    'Asia/Baghdad': 'Iraq (Baghdad) - UTC+3',
    'Asia/Damascus': 'Syria (Damascus) - UTC+2',
    'Asia/Beirut': 'Lebanon (Beirut) - UTC+2',
    'Asia/Amman': 'Jordan (Amman) - UTC+2',
    'Europe/London': 'United Kingdom (London) - UTC+0/+1',
    'Europe/Paris': 'France (Paris) - UTC+1/+2',
    'Europe/Berlin': 'Germany (Berlin) - UTC+1/+2',
    'America/New_York': 'United States (New York) - UTC-5/-4',
    'America/Los_Angeles': 'United States (Los Angeles) - UTC-8/-7',
    'UTC': 'Coordinated Universal Time (UTC)',
  };

  return timezoneNames[timezone] || timezone;
}

// Helper function to get current time in a timezone
export function getCurrentTimeInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  } catch (error) {
    return 'Invalid timezone';
  }
}

export type SchoolSettingsInput = z.infer<typeof schoolSettingsSchema>








