"use client"

import TextAlign from "@tiptap/extension-text-align"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Redo,
  Undo,
} from "lucide-react"

import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  className,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4",
          disabled && "opacity-50 cursor-not-allowed"
        ),
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className={cn("rounded-md border", className)}>
      {/* Toolbar */}
      <div className="bg-muted/30 flex flex-wrap gap-1 border-b p-2">
        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || disabled}
          className={cn(
            "hover:bg-muted rounded p-2 disabled:cursor-not-allowed disabled:opacity-30",
            "transition-colors"
          )}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || disabled}
          className={cn(
            "hover:bg-muted rounded p-2 disabled:cursor-not-allowed disabled:opacity-30",
            "transition-colors"
          )}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>

        <div className="bg-border mx-1 w-px" />

        {/* Headings */}
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={disabled}
          className={cn(
            "hover:bg-muted rounded p-2 disabled:cursor-not-allowed disabled:opacity-30",
            "transition-colors",
            editor.isActive("heading", { level: 2 }) && "bg-muted"
          )}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          disabled={disabled}
          className={cn(
            "hover:bg-muted rounded p-2 disabled:cursor-not-allowed disabled:opacity-30",
            "transition-colors",
            editor.isActive("heading", { level: 3 }) && "bg-muted"
          )}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="bg-border mx-1 w-px" />

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          className={cn(
            "hover:bg-muted rounded p-2 disabled:cursor-not-allowed disabled:opacity-30",
            "transition-colors",
            editor.isActive("bold") && "bg-muted"
          )}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          className={cn(
            "hover:bg-muted rounded p-2 disabled:cursor-not-allowed disabled:opacity-30",
            "transition-colors",
            editor.isActive("italic") && "bg-muted"
          )}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>

        <div className="bg-border mx-1 w-px" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          className={cn(
            "hover:bg-muted rounded p-2 disabled:cursor-not-allowed disabled:opacity-30",
            "transition-colors",
            editor.isActive("bulletList") && "bg-muted"
          )}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          className={cn(
            "hover:bg-muted rounded p-2 disabled:cursor-not-allowed disabled:opacity-30",
            "transition-colors",
            editor.isActive("orderedList") && "bg-muted"
          )}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="bg-border mx-1 w-px" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          disabled={disabled}
          className={cn(
            "hover:bg-muted rounded p-2 disabled:cursor-not-allowed disabled:opacity-30",
            "transition-colors",
            editor.isActive({ textAlign: "left" }) && "bg-muted"
          )}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          disabled={disabled}
          className={cn(
            "hover:bg-muted rounded p-2 disabled:cursor-not-allowed disabled:opacity-30",
            "transition-colors",
            editor.isActive({ textAlign: "center" }) && "bg-muted"
          )}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          disabled={disabled}
          className={cn(
            "hover:bg-muted rounded p-2 disabled:cursor-not-allowed disabled:opacity-30",
            "transition-colors",
            editor.isActive({ textAlign: "right" }) && "bg-muted"
          )}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  )
}
