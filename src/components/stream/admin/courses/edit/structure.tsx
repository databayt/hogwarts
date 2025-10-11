"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface CourseStructureProps {
  data: {
    id: string;
    title: string;
    chapters?: Array<{
      id: string;
      title: string;
      position: number;
      lessons?: Array<{
        id: string;
        title: string;
        position: number;
      }>;
    }>;
  };
}

export function CourseStructure({ data }: CourseStructureProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3>Course Chapters</h3>
          <p className="muted">
            Organize your course content into chapters and lessons
          </p>
        </div>
        <Button>
          <PlusIcon className="mr-2 size-4" />
          Add Chapter
        </Button>
      </div>

      {data.chapters && data.chapters.length > 0 ? (
        <div className="space-y-4">
          {data.chapters.map((chapter) => (
            <Card key={chapter.id}>
              <CardHeader>
                <CardTitle>{chapter.title}</CardTitle>
                <CardDescription>
                  {chapter.lessons?.length || 0} lesson(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chapter.lessons && chapter.lessons.length > 0 ? (
                  <ul className="space-y-2">
                    {chapter.lessons.map((lesson) => (
                      <li key={lesson.id} className="flex items-center justify-between">
                        <span>{lesson.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No lessons yet</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="muted">No chapters yet. Create your first chapter to get started.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
