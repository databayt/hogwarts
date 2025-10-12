"use server";

import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { revalidatePath } from "next/cache";
import {
  bookSchema,
  borrowBookSchema,
  returnBookSchema,
  deleteBookSchema,
  type BookSchema,
  type BorrowBookSchema,
  type ReturnBookSchema,
  type DeleteBookSchema
} from "./validation";
import { LIBRARY_CONFIG } from "./config";
import type { ActionResponse, Book } from "./types";

// Create a new book
export async function createBook(
  data: BookSchema & { schoolId: string }
): Promise<ActionResponse<Book>> {
  try {
    const { schoolId: contextSchoolId } = await getTenantContext();

    if (!contextSchoolId) {
      return {
        success: false,
        message: "School context not found",
      };
    }

    // Use context schoolId for additional security, ignore client-provided schoolId
    const schoolId = contextSchoolId;

    // Validate input
    const validatedData = bookSchema.parse(data);

    // Create book in database
    const book = await db.book.create({
      data: {
        ...validatedData,
        schoolId,
        availableCopies: validatedData.totalCopies,
      },
    });

    revalidatePath("/library");
    revalidatePath("/library/admin/books");

    return {
      success: true,
      message: "Book created successfully",
      data: book as Book,
    };
  } catch (error) {
    console.error("Create book error:", error);
    return {
      success: false,
      message: "Failed to create book",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Borrow a book
export async function borrowBook(
  data: Omit<BorrowBookSchema, "dueDate"> & { schoolId: string }
): Promise<ActionResponse> {
  try {
    const { schoolId: contextSchoolId } = await getTenantContext();

    if (!contextSchoolId) {
      return {
        success: false,
        message: "School context not found",
      };
    }

    // Use context schoolId for security
    const schoolId = contextSchoolId;
    const { bookId, userId } = data;

    // Check if book exists and is available
    const book = await db.book.findFirst({
      where: {
        id: bookId,
        schoolId, // Ensure book belongs to this school
      },
    });

    if (!book) {
      return {
        success: false,
        message: "Book not found",
      };
    }

    if (book.availableCopies <= 0) {
      return {
        success: false,
        message: "No copies available",
      };
    }

    // Check if user already borrowed this book
    const existingBorrow = await db.borrowRecord.findFirst({
      where: {
        bookId,
        userId,
        schoolId,
        status: "BORROWED",
      },
    });

    if (existingBorrow) {
      return {
        success: false,
        message: "You have already borrowed this book",
      };
    }

    // Calculate due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LIBRARY_CONFIG.MAX_BORROW_DAYS);

    // Create borrow record and update book availability
    await db.$transaction([
      db.borrowRecord.create({
        data: {
          bookId,
          userId,
          schoolId,
          dueDate,
          status: "BORROWED",
        },
      }),
      db.book.update({
        where: { id: bookId },
        data: {
          availableCopies: {
            decrement: 1,
          },
        },
      }),
    ]);

    revalidatePath("/library");
    revalidatePath(`/library/books/${bookId}`);
    revalidatePath("/library/my-profile");

    return {
      success: true,
      message: `Book borrowed successfully. Due date: ${dueDate.toLocaleDateString()}`,
    };
  } catch (error) {
    console.error("Borrow book error:", error);
    return {
      success: false,
      message: "Failed to borrow book",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Return a book
export async function returnBook(
  data: ReturnBookSchema
): Promise<ActionResponse> {
  try {
    const { schoolId: contextSchoolId } = await getTenantContext();

    if (!contextSchoolId) {
      return {
        success: false,
        message: "School context not found",
      };
    }

    const schoolId = contextSchoolId;
    const { borrowRecordId } = data;

    // Find borrow record (ensure it belongs to this school)
    const borrowRecord = await db.borrowRecord.findFirst({
      where: {
        id: borrowRecordId,
        schoolId,
      },
      include: { book: true },
    });

    if (!borrowRecord) {
      return {
        success: false,
        message: "Borrow record not found",
      };
    }

    if (borrowRecord.status === "RETURNED") {
      return {
        success: false,
        message: "Book already returned",
      };
    }

    // Update borrow record and increment available copies
    await db.$transaction([
      db.borrowRecord.update({
        where: { id: borrowRecordId },
        data: {
          status: "RETURNED",
          returnDate: new Date(),
        },
      }),
      db.book.update({
        where: { id: borrowRecord.bookId },
        data: {
          availableCopies: {
            increment: 1,
          },
        },
      }),
    ]);

    revalidatePath("/library");
    revalidatePath(`/library/books/${borrowRecord.bookId}`);
    revalidatePath("/library/my-profile");

    return {
      success: true,
      message: "Book returned successfully",
    };
  } catch (error) {
    console.error("Return book error:", error);
    return {
      success: false,
      message: "Failed to return book",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Delete a book (admin only)
export async function deleteBook(
  data: DeleteBookSchema
): Promise<ActionResponse> {
  try {
    const { schoolId: contextSchoolId } = await getTenantContext();

    if (!contextSchoolId) {
      return {
        success: false,
        message: "School context not found",
      };
    }

    const schoolId = contextSchoolId;
    const { id } = data;

    // Verify book belongs to this school
    const book = await db.book.findFirst({
      where: {
        id,
        schoolId,
      },
    });

    if (!book) {
      return {
        success: false,
        message: "Book not found",
      };
    }

    // Check if book has active borrows
    const activeBorrows = await db.borrowRecord.count({
      where: {
        bookId: id,
        schoolId,
        status: "BORROWED",
      },
    });

    if (activeBorrows > 0) {
      return {
        success: false,
        message: "Cannot delete book with active borrows",
      };
    }

    // Delete book (this will cascade delete borrow records)
    await db.book.delete({
      where: { id },
    });

    revalidatePath("/library");
    revalidatePath("/library/admin/books");

    return {
      success: true,
      message: "Book deleted successfully",
    };
  } catch (error) {
    console.error("Delete book error:", error);
    return {
      success: false,
      message: "Failed to delete book",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Mark overdue books
export async function markOverdueBooks(): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext();

    if (!schoolId) {
      return {
        success: false,
        message: "School context not found",
      };
    }

    const now = new Date();

    await db.borrowRecord.updateMany({
      where: {
        schoolId,
        status: "BORROWED",
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: "OVERDUE",
      },
    });

    revalidatePath("/library/admin");
    revalidatePath("/library/my-profile");

    return {
      success: true,
      message: "Overdue books updated",
    };
  } catch (error) {
    console.error("Mark overdue books error:", error);
    return {
      success: false,
      message: "Failed to mark overdue books",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
