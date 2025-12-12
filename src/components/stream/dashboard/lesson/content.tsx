"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Play,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { markLessonComplete, markLessonIncomplete } from "./actions";
import type { LessonWithProgress } from "@/components/stream/data/course/get-lesson-with-progress";

interface StreamLessonContentProps {
  dictionary: Record<string, unknown>;
  lang: string;
  schoolId: string | null;
  subdomain: string;
  lesson: LessonWithProgress;
}

export function StreamLessonContent({
  dictionary,
  lang,
  schoolId,
  subdomain,
  lesson,
}: StreamLessonContentProps) {
  const [isCompleted, setIsCompleted] = useState(
    lesson.progress?.isCompleted ?? false
  );
  const [isPending, startTransition] = useTransition();

  const handleToggleComplete = () => {
    startTransition(async () => {
      try {
        if (isCompleted) {
          const result = await markLessonIncomplete(
            lesson.id,
            lesson.chapter.course.slug
          );
          if (result.status === "error") {
            toast.error(result.message);
            return;
          }
          setIsCompleted(false);
          toast.success("Marked as incomplete");
        } else {
          const result = await markLessonComplete(
            lesson.id,
            lesson.chapter.course.slug
          );
          if (result.status === "error") {
            toast.error(result.message);
            return;
          }
          setIsCompleted(true);
          toast.success("Marked as complete!");
        }
      } catch {
        toast.error("Failed to update progress");
      }
    });
  };

  const baseUrl = `/${lang}/s/${subdomain}/stream/dashboard/${lesson.chapter.course.slug}`;

  return (
    <div className="py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href={baseUrl}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Course
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{lesson.chapter.title}</span>
        <span className="text-muted-foreground">/</span>
        <span>{lesson.title}</span>
      </div>

      {/* Video Player */}
      <Card>
        <CardContent className="p-0">
          {lesson.videoUrl ? (
            <div className="aspect-video w-full">
              {/* Check if it's a YouTube URL */}
              {lesson.videoUrl.includes("youtube.com") ||
              lesson.videoUrl.includes("youtu.be") ? (
                <iframe
                  className="w-full h-full rounded-t-lg"
                  src={getYouTubeEmbedUrl(lesson.videoUrl)}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : lesson.videoUrl.includes("vimeo.com") ? (
                <iframe
                  className="w-full h-full rounded-t-lg"
                  src={getVimeoEmbedUrl(lesson.videoUrl)}
                  title={lesson.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  className="w-full h-full rounded-t-lg"
                  controls
                  src={lesson.videoUrl}
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
              <div className="text-center">
                <Play className="size-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No video available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lesson Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{lesson.title}</CardTitle>
                {lesson.isFree && (
                  <Badge variant="secondary">Free Preview</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {lesson.chapter.title} &bull; {lesson.chapter.course.title}
              </p>
            </div>
            <Button
              onClick={handleToggleComplete}
              disabled={isPending}
              variant={isCompleted ? "secondary" : "default"}
              className="shrink-0"
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 className="mr-2 size-4 text-green-500" />
              ) : (
                <Circle className="mr-2 size-4" />
              )}
              {isCompleted ? "Completed" : "Mark as Complete"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Description */}
          {lesson.description && (
            <div className="prose dark:prose-invert max-w-none mb-6">
              <p>{lesson.description}</p>
            </div>
          )}

          {/* Duration */}
          {lesson.duration && (
            <p className="text-sm text-muted-foreground mb-4">
              Duration: {lesson.duration} minutes
            </p>
          )}

          {/* Attachments */}
          {lesson.attachments.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <h4 className="font-medium">Resources</h4>
                <div className="grid gap-2">
                  {lesson.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md border hover:bg-accent transition-colors"
                    >
                      <FileDown className="size-4 text-muted-foreground" />
                      <span className="text-sm">{attachment.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {lesson.previousLesson ? (
          <Link href={`${baseUrl}/${lesson.previousLesson.id}`}>
            <Button variant="outline">
              <ChevronLeft className="mr-2 size-4" />
              <span className="hidden sm:inline">Previous:</span>{" "}
              <span className="truncate max-w-[150px]">
                {lesson.previousLesson.title}
              </span>
            </Button>
          </Link>
        ) : (
          <div />
        )}

        {lesson.nextLesson ? (
          <Link href={`${baseUrl}/${lesson.nextLesson.id}`}>
            <Button>
              <span className="hidden sm:inline">Next:</span>{" "}
              <span className="truncate max-w-[150px]">
                {lesson.nextLesson.title}
              </span>
              <ChevronRight className="ml-2 size-4" />
            </Button>
          </Link>
        ) : (
          <Link href={baseUrl}>
            <Button>
              Back to Course
              <ChevronRight className="ml-2 size-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

// Helper functions for video embedding
function getYouTubeEmbedUrl(url: string): string {
  const videoId = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  )?.[1];
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function getVimeoEmbedUrl(url: string): string {
  const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
  return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
}
