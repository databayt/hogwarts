"use server";

import { customAlphabet } from "nanoid";
import { revalidateTag, unstable_noStore } from "next/cache";
import type { Task } from "@prisma/client";
import { db } from "@/lib/db";


import { getErrorMessage } from "@/components/table/lib/handle-error";

import { generateRandomTask } from "./utils";
import type { CreateTaskSchema, UpdateTaskSchema } from "./validations";

export async function seedTasks(input: { count: number }) {
  const count = input.count ?? 100;

  try {
    const allTasks: Omit<Task, "id">[] = [];

    for (let i = 0; i < count; i++) {
      allTasks.push(generateRandomTask());
    }

    await db.task.deleteMany();

    console.log("📝 Inserting tasks", allTasks.length);

    await db.task.createMany({
      data: allTasks,
      skipDuplicates: true,
    });
  } catch (err) {
    console.error(err);
  }
}

export async function createTask(input: CreateTaskSchema) {
  unstable_noStore();
  try {
    await db.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          code: `TASK-${customAlphabet("0123456789", 4)()}`,
          title: input.title,
          status: input.status,
          label: input.label,
          priority: input.priority,
        },
        select: {
          id: true,
        },
      });

      // Delete a task to keep the total number of tasks constant
      const taskToDelete = await tx.task.findFirst({
        where: {
          id: {
            not: newTask.id,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
        },
      });

      if (taskToDelete) {
        await tx.task.delete({
          where: {
            id: taskToDelete.id,
          },
        });
      }
    });

    revalidateTag("tasks", "max");
    revalidateTag("task-status-counts", "max");
    revalidateTag("task-priority-counts", "max");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateTask(input: UpdateTaskSchema & { id: string }) {
  unstable_noStore();
  try {
    const data = await db.task.update({
      where: {
        id: input.id,
      },
      data: {
        title: input.title,
        label: input.label,
        status: input.status,
        priority: input.priority,
      },
      select: {
        status: true,
        priority: true,
      },
    });

    revalidateTag("tasks", "max");
    if (data.status === input.status) {
      revalidateTag("task-status-counts", "max");
    }
    if (data.priority === input.priority) {
      revalidateTag("task-priority-counts", "max");
    }

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateTasks(input: {
  ids: string[];
  label?: Task["label"];
  status?: Task["status"];
  priority?: Task["priority"];
}) {
  unstable_noStore();
  try {
    const updateData: Partial<Pick<Task, "label" | "status" | "priority">> = {};
    if (input.label !== undefined) updateData.label = input.label;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.priority !== undefined) updateData.priority = input.priority;

    await db.task.updateMany({
      where: {
        id: {
          in: input.ids,
        },
      },
      data: updateData,
    });

    revalidateTag("tasks", "max");
    if (input.status !== undefined) {
      revalidateTag("task-status-counts", "max");
    }
    if (input.priority !== undefined) {
      revalidateTag("task-priority-counts", "max");
    }

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteTask(input: { id: string }) {
  unstable_noStore();
  try {
    await db.$transaction(async (tx) => {
      await tx.task.delete({
        where: {
          id: input.id,
        },
      });

      // Create a new task for the deleted one
      await tx.task.create({
        data: generateRandomTask(),
      });
    });

    revalidateTag("tasks", "max");
    revalidateTag("task-status-counts", "max");
    revalidateTag("task-priority-counts", "max");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteTasks(input: { ids: string[] }) {
  unstable_noStore();
  try {
    await db.$transaction(async (tx) => {
      await tx.task.deleteMany({
        where: {
          id: {
            in: input.ids,
          },
        },
      });

      // Create new tasks for the deleted ones
      await tx.task.createMany({
        data: input.ids.map(() => generateRandomTask()),
      });
    });

    revalidateTag("tasks", "max");
    revalidateTag("task-status-counts", "max");
    revalidateTag("task-priority-counts", "max");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}
