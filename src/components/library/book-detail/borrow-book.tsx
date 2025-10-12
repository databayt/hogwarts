"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { borrowBook, returnBook } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  bookId: string;
  userId: string;
  schoolId: string;
  availableCopies: number;
  hasBorrowedBook: boolean;
  borrowRecordId?: string;
}

export default function BorrowBook({
  bookId,
  userId,
  schoolId,
  availableCopies,
  hasBorrowedBook,
  borrowRecordId,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleBorrow = async () => {
    setIsLoading(true);

    try {
      const result = await borrowBook({
        bookId,
        userId,
        schoolId,
      });

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to borrow book");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!borrowRecordId) return;

    setIsLoading(true);

    try {
      const result = await returnBook({
        borrowRecordId,
        schoolId,
      });

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to return book");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (hasBorrowedBook) {
    return (
      <div className="borrow-book-section">
        <p className="muted mb-2 text-emerald-600">
          You have borrowed this book
        </p>
        <Button
          onClick={handleReturn}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? "Returning..." : "Return Book"}
        </Button>
      </div>
    );
  }

  if (availableCopies === 0) {
    return (
      <div className="borrow-book-section">
        <Button disabled className="w-full">
          Currently Unavailable
        </Button>
      </div>
    );
  }

  return (
    <div className="borrow-book-section">
      <Button
        onClick={handleBorrow}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Borrowing..." : "Borrow Book"}
      </Button>
    </div>
  );
}
