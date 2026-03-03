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
import { Textarea } from "@/components/ui/textarea"

import { useTaskStore } from "../utils/store"

export default function NewTaskDialog({ dictionary }: { dictionary?: any }) {
  const k = dictionary?.operator?.kanban
  const addTask = useTaskStore((state) => state.addTask)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = e.currentTarget
    const formData = new FormData(form)
    const { title, description } = Object.fromEntries(formData)

    if (typeof title !== "string" || typeof description !== "string") return
    addTask(title, description)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          {k?.addNewTodo || "\uFF0B Add New Todo"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{k?.addTodoTitle || "Add New Todo"}</DialogTitle>
          <DialogDescription>
            {k?.addTodoDescription || "What do you want to get done today?"}
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
              placeholder={k?.todoTitlePlaceholder || "Todo title..."}
              className="col-span-4"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Textarea
              id="description"
              name="description"
              placeholder={k?.todoDescriptionPlaceholder || "Description..."}
              className="col-span-4"
            />
          </div>
        </form>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button type="submit" size="sm" form="todo-form">
              {k?.addTodo || "Add Todo"}
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
