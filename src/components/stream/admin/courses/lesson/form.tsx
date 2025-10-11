"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { createLessonSchema, type CreateLessonInput } from "../create/validation";
import { ArrowLeft, Loader2, SaveIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface LessonFormProps {
  data: {
    id: string;
    title: string;
    description: string | null;
    videoUrl: string | null;
    duration: number | null;
    position: number;
    isFree: boolean;
  };
  courseId: string;
  chapterId: string;
}

export function LessonForm({ data, courseId, chapterId }: LessonFormProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<CreateLessonInput>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      title: data.title,
      description: data.description || "",
      videoUrl: data.videoUrl || undefined,
      duration: data.duration || undefined,
      position: data.position,
      isFree: data.isFree,
    },
  });

  async function onSubmit(values: CreateLessonInput) {
    setIsPending(true);
    try {
      // TODO: Implement update lesson action
      console.log("Update lesson:", values);
      toast.success("Lesson updated successfully!");
    } catch (error) {
      toast.error("Failed to update lesson");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/stream/admin/courses/${courseId}/edit`}
          className={buttonVariants({
            variant: "outline",
            size: "icon",
          })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h2>Edit Lesson</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
          <CardDescription>
            Update the lesson information and content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter lesson title" {...field} />
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
                        placeholder="Enter lesson description"
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
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://..."
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
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter duration"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : parseInt(val));
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
        </CardContent>
      </Card>
    </>
  );
}
