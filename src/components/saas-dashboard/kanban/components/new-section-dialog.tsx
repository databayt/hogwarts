"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { useTaskStore } from "../utils/store"

export default function NewSectionDialog({ dictionary }: { dictionary?: any }) {
  const k = dictionary?.operator?.kanban
  const addCol = useTaskStore((state) => state.addCol)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = e.currentTarget
    const formData = new FormData(form)
    const { title } = Object.fromEntries(formData)

    if (typeof title !== "string") return
    addCol(title)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="lg" className="w-full">
          {k?.addNewSection || "\uFF0B Add New Section"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{k?.addSectionTitle || "Add New Section"}</DialogTitle>
          <DialogDescription>
            {k?.addSectionDescription || "What section you want to add today?"}
          </DialogDescription>
        </DialogHeader>
        <form
          id="todo-form"
          className="grid gap-4 py-4"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="title"
              name="title"
              placeholder={k?.sectionTitlePlaceholder || "Section title..."}
              className="col-span-4"
            />
          </div>
        </form>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button type="submit" size="sm" form="todo-form">
              {k?.addSection || "Add Section"}
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
