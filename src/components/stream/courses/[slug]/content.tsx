"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Clock, BarChart3 } from "lucide-react";
import Link from "next/link";

interface Props {
  slug: string;
}

export default function CourseDetailContent({ slug }: Props) {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <BookOpen className="mx-auto size-16 text-muted-foreground mb-4" />
            <h2>Course Details</h2>
            <p className="muted mb-6">
              Course details for: <span className="font-semibold">{slug}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              This is a placeholder for the full course details page.
            </p>
            <Link
              className={buttonVariants()}
              href="/stream/courses"
            >
              Back to Courses
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
