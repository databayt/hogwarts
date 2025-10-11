"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateCourseSchema, type UpdateCourseInput } from "../create/validation";
import { Loader2, SaveIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EditCourseFormProps {
  data: {
    id: string;
    title: string;
    description: string | null;
    price: number | null;
    imageUrl: string | null;
    isPublished: boolean;
  };
}

export function EditCourseForm({ data }: EditCourseFormProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<UpdateCourseInput>({
    resolver: zodResolver(updateCourseSchema),
    defaultValues: {
      title: data.title,
      description: data.description || "",
      price: data.price || undefined,
      imageUrl: data.imageUrl || undefined,
      isPublished: data.isPublished,
    },
  });

  async function onSubmit(values: UpdateCourseInput) {
    setIsPending(true);
    try {
      // TODO: Implement update course action
      console.log("Update course:", values);
      toast.success("Course updated successfully!");
    } catch (error) {
      toast.error("Failed to update course");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter course title" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter course description"
                  className="min-h-[120px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter price"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : parseFloat(val));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <SaveIcon className="mr-2 size-4" />
              Save Changes
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
