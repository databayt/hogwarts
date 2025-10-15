"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { bookSchema, type BookSchema } from "../../validation";
import { BOOK_GENRES } from "../../config";
import { createBook } from "../../actions";
import ColorPicker from "./color-picker";
import FileUpload from "./file-upload";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  type?: "create" | "update";
  bookData?: Partial<BookSchema>;
  schoolId: string;
  dictionary: any;
  lang: Locale;
}

export default function BookForm({ type = "create", bookData, schoolId, dictionary, lang }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = dictionary.school;

  const form = useForm<BookSchema>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: bookData?.title || "",
      author: bookData?.author || "",
      genre: bookData?.genre || "",
      rating: bookData?.rating || 0,
      coverUrl: bookData?.coverUrl || "",
      coverColor: bookData?.coverColor || "#000000",
      description: bookData?.description || "",
      totalCopies: bookData?.totalCopies || 1,
      videoUrl: bookData?.videoUrl || "",
      summary: bookData?.summary || "",
    },
  });

  const onSubmit = async (values: BookSchema) => {
    setIsSubmitting(true);

    try {
      const result = await createBook({
        ...values,
        schoolId,
      });

      if (result.success) {
        toast.success(result.message);
        router.push("/library/admin/books");
        router.refresh();
      } else {
        toast.error(result.error || t.library.messages.bookNotFound);
      }
    } catch (error) {
      toast.error(t.common.messages.errorOccurred);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.library.admin.bookTitle}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t.library.admin.bookTitle}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.library.admin.bookAuthor}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t.library.admin.bookAuthor}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="genre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.library.admin.bookGenre}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t.library.admin.selectGenre} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BOOK_GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.library.admin.bookRating}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  placeholder={t.library.admin.enterRating}
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="totalCopies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.library.admin.totalCopies}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  placeholder={t.library.admin.totalCopies}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coverUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.library.admin.bookCover}</FormLabel>
              <FormControl>
                <FileUpload
                  value={field.value}
                  onChange={field.onChange}
                  accept="image"
                  placeholder={t.library.admin.uploadBookCover}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coverColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.library.admin.coverColor}</FormLabel>
              <FormControl>
                <ColorPicker
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="videoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.library.admin.bookTrailer}</FormLabel>
              <FormControl>
                <FileUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  accept="video"
                  placeholder={t.library.admin.uploadBookTrailer}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.library.admin.bookDescription}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t.library.admin.bookDescription}
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.library.admin.bookSummary}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t.library.admin.bookSummary}
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            {t.library.admin.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t.library.admin.creating : t.library.admin.addBookToLibrary}
          </Button>
        </div>
      </form>
    </Form>
  );
}
