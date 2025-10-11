"use client";

import { Textarea } from "@/components/ui/textarea";
import { ControllerRenderProps } from "react-hook-form";

interface RichTextEditorProps {
  field: ControllerRenderProps<any, any>;
}

/**
 * Simple rich text editor component
 * TODO: Replace with a full-featured editor like TipTap or Slate in the future
 */
export function RichTextEditor({ field }: RichTextEditorProps) {
  return (
    <Textarea
      {...field}
      className="min-h-[200px]"
      placeholder="Enter detailed description..."
    />
  );
}
