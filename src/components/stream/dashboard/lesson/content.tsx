"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface StreamLessonContentProps {
  dictionary: any;
  lang: string;
  schoolId: string | null;
  userId: string;
  courseSlug: string;
  lessonId: string;
}

export function StreamLessonContent({
  dictionary,
  lang,
  schoolId,
  userId,
  courseSlug,
  lessonId,
}: StreamLessonContentProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lesson Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="muted">Video player placeholder</p>
            </div>

            <div className="space-y-2">
              <h3>Lesson Title</h3>
              <p className="muted">
                Lesson description will be displayed here. This is a placeholder
                for the actual lesson content that will be fetched from the database.
              </p>
            </div>

            <Button className="w-full">
              <CheckCircle2 className="mr-2 size-4" />
              Mark as Complete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
