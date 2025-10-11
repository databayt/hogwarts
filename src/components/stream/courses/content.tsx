"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function CoursesContent() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h2>Explore Courses</h2>
        <p className="muted">
          Discover our wide range of courses designed to help you achieve your
          learning goals.
        </p>
      </div>

      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <BookOpen className="mx-auto size-16 text-muted-foreground mb-4" />
            <h3>No Courses Available</h3>
            <p className="muted mb-6">
              There are currently no courses available. Check back soon!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
