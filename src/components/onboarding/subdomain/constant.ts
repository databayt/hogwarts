export const SUBDOMAIN_CONSTANTS = {
  STEP_NAME: 'subdomain',
  STEP_TITLE: 'School Domain',
  STEP_DESCRIPTION: 'Choose your school\'s web address.',
  MIN_LENGTH: 3,
  MAX_LENGTH: 30,
  DOMAIN_SUFFIX: '.databayt.org',
} as const;

export const SUBDOMAIN_RULES = [
  'Must be 3-30 characters long',
  'Can only contain letters, numbers, and hyphens',
  'Must start and end with a letter or number',
  'Cannot contain consecutive hyphens',
  'Cannot use reserved words',
] as const;

export const RESERVED_SUBDOMAINS = [
  'www',
  'mail',
  'email',
  'admin',
  'api',
  'app',
  'blog',
  'dev',
  'test',
  'staging',
  'prod',
  'production',
  'support',
  'help',
  'docs',
  'status',
  'cdn',
  'assets',
  'static',
  'files',
  'images',
  'media',
  'ftp',
  'sftp',
  'ssh',
  'ssl',
  'secure',
  'login',
  'signup',
  'register',
  'account',
  'dashboard',
  'portal',
] as const;

export const SUBDOMAIN_SUGGESTIONS_SUFFIXES = [
  'school',
  'academy',
  'edu',
  'learning',
  'institute',
  'college',
  'campus',
  'education',
] as const;

export const VALIDATION_MESSAGES = {
  TOO_SHORT: `Subdomain must be at least ${SUBDOMAIN_CONSTANTS.MIN_LENGTH} characters`,
  TOO_LONG: `Subdomain must be less than ${SUBDOMAIN_CONSTANTS.MAX_LENGTH} characters`,
  INVALID_CHARACTERS: 'Subdomain can only contain letters, numbers, and hyphens',
  INVALID_START: 'Subdomain must start with a letter or number',
  INVALID_END: 'Subdomain must end with a letter or number',
  CONSECUTIVE_HYPHENS: 'Subdomain cannot contain consecutive hyphens',
  RESERVED_WORD: 'This subdomain is reserved and cannot be used',
  ALREADY_TAKEN: 'This subdomain is already taken',
  AVAILABLE: 'Subdomain is available!',
  CHECKING: 'Checking availability...',
} as const;

export const EXAMPLE_DOMAINS = [
  'greenwood-elementary',
  'riverside-academy',
  'tech-high-school',
  'montessori-learning',
  'international-school',
] as const;