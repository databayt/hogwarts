"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { SortableList } from "@/components/stream/shared/sortable-list";
import {
  PlusIcon,
  ChevronDown,
  GripVertical,
  Pencil,
  Trash2,
  Video,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from "./actions";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  duration: number | null;
}

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  lessons: Lesson[];
}

interface CourseStructureProps {
  data: {
    id: string;
    title: string;
    chapters: Chapter[];
  };
}

export function CourseStructure({ data }: CourseStructureProps) {
  const [chapters, setChapters] = useState<Chapter[]>(data.chapters || []);
  const [isPending, startTransition] = useTransition();

  // Chapter state
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterTitle, setChapterTitle] = useState("");

  // Lesson state
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");

  // Expanded chapters
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(chapters.map((c) => c.id))
  );

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  // ==========================================
  // CHAPTER HANDLERS
  // ==========================================

  const handleCreateChapter = () => {
    setEditingChapter(null);
    setChapterTitle("");
    setIsChapterDialogOpen(true);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterTitle(chapter.title);
    setIsChapterDialogOpen(true);
  };

  const handleSaveChapter = () => {
    if (!chapterTitle.trim()) {
      toast.error("Chapter title is required");
      return;
    }

    startTransition(async () => {
      try {
        if (editingChapter) {
          // Update existing chapter
          const result = await updateChapter(editingChapter.id, {
            title: chapterTitle,
          });

          if (result.status === "error") {
            toast.error(result.message);
            return;
          }

          setChapters((prev) =>
            prev.map((c) =>
              c.id === editingChapter.id ? { ...c, title: chapterTitle } : c
            )
          );
          toast.success("Chapter updated");
        } else {
          // Create new chapter
          const result = await createChapter({
            title: chapterTitle,
            courseId: data.id,
          });

          if (result.status === "error") {
            toast.error(result.message);
            return;
          }

          toast.success("Chapter created");
          // Refresh will happen via revalidation
        }

        setIsChapterDialogOpen(false);
        setChapterTitle("");
        setEditingChapter(null);
      } catch {
        toast.error("Failed to save chapter");
      }
    });
  };

  const handleDeleteChapter = (chapterId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteChapter({
          chapterId,
          courseId: data.id,
        });

        if (result.status === "error") {
          toast.error(result.message);
          return;
        }

        setChapters((prev) => prev.filter((c) => c.id !== chapterId));
        toast.success("Chapter deleted");
      } catch {
        toast.error("Failed to delete chapter");
      }
    });
  };

  const handleReorderChapters = (reorderedChapters: Chapter[]) => {
    setChapters(reorderedChapters);

    startTransition(async () => {
      try {
        const result = await reorderChapters(
          data.id,
          reorderedChapters.map((c) => ({ id: c.id, position: c.position }))
        );

        if (result.status === "error") {
          toast.error(result.message);
          // Revert on error
          setChapters(data.chapters);
        }
      } catch {
        toast.error("Failed to reorder chapters");
        setChapters(data.chapters);
      }
    });
  };

  // ==========================================
  // LESSON HANDLERS
  // ==========================================

  const handleCreateLesson = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setEditingLesson(null);
    setLessonTitle("");
    setLessonDescription("");
    setLessonVideoUrl("");
    setIsLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson, chapterId: string) => {
    setSelectedChapterId(chapterId);
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setLessonDescription(lesson.description || "");
    setLessonVideoUrl(lesson.videoUrl || "");
    setIsLessonDialogOpen(true);
  };

  const handleSaveLesson = () => {
    if (!lessonTitle.trim()) {
      toast.error("Lesson title is required");
      return;
    }

    if (!selectedChapterId) {
      toast.error("Chapter not selected");
      return;
    }

    startTransition(async () => {
      try {
        if (editingLesson) {
          // Update existing lesson
          const result = await updateLesson(editingLesson.id, {
            title: lessonTitle,
            description: lessonDescription || null,
            videoUrl: lessonVideoUrl || null,
          });

          if (result.status === "error") {
            toast.error(result.message);
            return;
          }

          setChapters((prev) =>
            prev.map((c) =>
              c.id === selectedChapterId
                ? {
                    ...c,
                    lessons: c.lessons.map((l) =>
                      l.id === editingLesson.id
                        ? {
                            ...l,
                            title: lessonTitle,
                            description: lessonDescription || null,
                            videoUrl: lessonVideoUrl || null,
                          }
                        : l
                    ),
                  }
                : c
            )
          );
          toast.success("Lesson updated");
        } else {
          // Create new lesson
          const result = await createLesson({
            title: lessonTitle,
            description: lessonDescription || null,
            videoUrl: lessonVideoUrl || null,
            chapterId: selectedChapterId,
            courseId: data.id,
          });

          if (result.status === "error") {
            toast.error(result.message);
            return;
          }

          toast.success("Lesson created");
          // Refresh will happen via revalidation
        }

        setIsLessonDialogOpen(false);
        setLessonTitle("");
        setLessonDescription("");
        setLessonVideoUrl("");
        setEditingLesson(null);
        setSelectedChapterId(null);
      } catch {
        toast.error("Failed to save lesson");
      }
    });
  };

  const handleDeleteLesson = (lessonId: string, chapterId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteLesson({
          lessonId,
          chapterId,
          courseId: data.id,
        });

        if (result.status === "error") {
          toast.error(result.message);
          return;
        }

        setChapters((prev) =>
          prev.map((c) =>
            c.id === chapterId
              ? { ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) }
              : c
          )
        );
        toast.success("Lesson deleted");
      } catch {
        toast.error("Failed to delete lesson");
      }
    });
  };

  const handleReorderLessons = (chapterId: string, reorderedLessons: Lesson[]) => {
    setChapters((prev) =>
      prev.map((c) =>
        c.id === chapterId ? { ...c, lessons: reorderedLessons } : c
      )
    );

    startTransition(async () => {
      try {
        const result = await reorderLessons(
          chapterId,
          reorderedLessons.map((l) => ({ id: l.id, position: l.position })),
          data.id
        );

        if (result.status === "error") {
          toast.error(result.message);
        }
      } catch {
        toast.error("Failed to reorder lessons");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3>Course Chapters</h3>
          <p className="muted">
            Organize your course content into chapters and lessons
          </p>
        </div>
        <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateChapter} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <PlusIcon className="mr-2 size-4" />
              )}
              Add Chapter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingChapter ? "Edit Chapter" : "Add New Chapter"}
              </DialogTitle>
              <DialogDescription>
                {editingChapter
                  ? "Update the chapter details below."
                  : "Enter a name for your new chapter."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="chapter-title">Chapter Title</Label>
                <Input
                  id="chapter-title"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="e.g., Introduction to the Course"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsChapterDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveChapter} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingChapter ? "Save Changes" : "Create Chapter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chapters List */}
      {chapters.length > 0 ? (
        <SortableList
          items={chapters}
          onReorder={handleReorderChapters}
          disabled={isPending}
          renderItem={(chapter) => (
            <Collapsible
              open={expandedChapters.has(chapter.id)}
              onOpenChange={() => toggleChapter(chapter.id)}
            >
              <Card className="border-0 shadow-none">
                <CardHeader className="p-0">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-2 hover:underline">
                      <ChevronDown
                        className={`size-4 transition-transform ${
                          expandedChapters.has(chapter.id) ? "" : "-rotate-90"
                        }`}
                      />
                      <CardTitle className="text-base">{chapter.title}</CardTitle>
                      <Badge variant="secondary">
                        {chapter.lessons?.length || 0} lessons
                      </Badge>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditChapter(chapter);
                        }}
                        disabled={isPending}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                            disabled={isPending}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Chapter?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete the chapter and all its lessons.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteChapter(chapter.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-4">
                    {chapter.lessons && chapter.lessons.length > 0 ? (
                      <SortableList
                        items={chapter.lessons}
                        onReorder={(lessons) =>
                          handleReorderLessons(chapter.id, lessons)
                        }
                        disabled={isPending}
                        renderItem={(lesson) => (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {lesson.videoUrl ? (
                                <Video className="size-4 text-blue-500" />
                              ) : (
                                <FileText className="size-4 text-muted-foreground" />
                              )}
                              <span>{lesson.title}</span>
                              {lesson.isFree && (
                                <Badge variant="outline" className="text-xs">
                                  Free
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditLesson(lesson, chapter.id)}
                                disabled={isPending}
                              >
                                <Pencil className="size-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={isPending}
                                  >
                                    <Trash2 className="size-3 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Lesson?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this lesson.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteLesson(lesson.id, chapter.id)
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        )}
                      />
                    ) : (
                      <p className="muted text-center py-2">No lessons yet</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => handleCreateLesson(chapter.id)}
                      disabled={isPending}
                    >
                      <PlusIcon className="mr-2 size-3" />
                      Add Lesson
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}
        />
      ) : (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="muted">
                No chapters yet. Create your first chapter to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? "Edit Lesson" : "Add New Lesson"}
            </DialogTitle>
            <DialogDescription>
              {editingLesson
                ? "Update the lesson details below."
                : "Enter the details for your new lesson."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson Title</Label>
              <Input
                id="lesson-title"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g., Getting Started"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-description">Description (optional)</Label>
              <Textarea
                id="lesson-description"
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                placeholder="Describe what this lesson covers..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-video">Video URL (optional)</Label>
              <Input
                id="lesson-video"
                value={lessonVideoUrl}
                onChange={(e) => setLessonVideoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLessonDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveLesson} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingLesson ? "Save Changes" : "Create Lesson"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
