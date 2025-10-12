// Library Management System - Configuration Constants

export const LIBRARY_CONFIG = {
  // Borrow limits
  MAX_BORROW_DAYS: 14,
  MAX_BOOKS_PER_USER: 5,

  // Book defaults
  DEFAULT_RATING: 0,
  MIN_RATING: 0,
  MAX_RATING: 5,

  // Pagination
  BOOKS_PER_PAGE: 10,
  ADMIN_BOOKS_PER_PAGE: 20,

  // Colors
  DEFAULT_COVER_COLOR: '#000000',

  // Status
  BORROW_STATUS: {
    BORROWED: 'BORROWED',
    RETURNED: 'RETURNED',
    OVERDUE: 'OVERDUE',
  } as const,

  USER_STATUS: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
  } as const,
} as const;

// Genre options for book form
export const BOOK_GENRES = [
  'Fiction',
  'Non-Fiction',
  'Science',
  'Technology',
  'History',
  'Biography',
  'Self-Help',
  'Business',
  'Psychology',
  'Philosophy',
  'Art',
  'Religion',
  'Travel',
  'Cooking',
  'Health',
  'Children',
  'Young Adult',
  'Romance',
  'Mystery',
  'Thriller',
  'Fantasy',
  'Science Fiction',
  'Horror',
  'Poetry',
  'Drama',
  'Comics',
  'Other',
] as const;

export type BookGenre = typeof BOOK_GENRES[number];

// Admin navigation items
export const ADMIN_NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/library/admin',
    icon: 'LayoutDashboard',
  },
  {
    title: 'All Books',
    href: '/library/admin/books',
    icon: 'BookOpen',
  },
  {
    title: 'Add New Book',
    href: '/library/admin/books/new',
    icon: 'Plus',
  },
] as const;
