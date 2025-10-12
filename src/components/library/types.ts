// Library Management System - Type Definitions

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  rating: number;
  coverUrl: string;
  coverColor: string;
  description: string;
  totalCopies: number;
  availableCopies: number;
  videoUrl?: string | null;
  summary: string;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BorrowRecord {
  id: string;
  userId: string;
  bookId: string;
  schoolId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date | null;
  status: BorrowStatus;
  createdAt: Date;
  updatedAt: Date;
  book?: Book;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export enum BorrowStatus {
  BORROWED = 'BORROWED',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE'
}

export enum LibraryUserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// Form types for book creation/editing
export interface BookFormData {
  title: string;
  author: string;
  genre: string;
  rating: number;
  coverUrl: string;
  coverColor: string;
  description: string;
  totalCopies: number;
  videoUrl?: string;
  summary: string;
}

// User profile for library
export interface LibraryUser {
  id: string;
  name: string | null;
  email: string | null;
  universityId?: number | null;
  universityCard?: string | null;
  libraryStatus?: LibraryUserStatus | null;
  lastActivityDate?: Date | null;
}

// Borrow request
export interface BorrowBookRequest {
  bookId: string;
  userId: string;
  schoolId: string;
  dueDate: Date;
}

// Return types for server actions
export interface ActionResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
