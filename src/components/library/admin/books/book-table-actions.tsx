"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteBook } from "../../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  bookId: string;
  schoolId: string;
}

export default function BookTableActions({ bookId, schoolId }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this book?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteBook({ id: bookId, schoolId });

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete book");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/library/books/${bookId}`)}
      >
        View
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
