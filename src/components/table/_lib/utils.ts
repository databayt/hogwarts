import { faker } from "@faker-js/faker";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircle2,
  CircleHelp,
  CircleIcon,
  CircleX,
  Timer,
} from "lucide-react";
import { customAlphabet } from "nanoid";
import type { Task, TaskStatus, TaskLabel, TaskPriority } from "@prisma/client";



export function generateRandomTask(): Omit<Task, "id"> {
  const statusValues: TaskStatus[] = [
    "todo",
    "in_progress",
    "done",
    "canceled",
  ];
  const labelValues: TaskLabel[] = [
    "bug",
    "feature",
    "enhancement",
    "documentation",
  ];
  const priorityValues: TaskPriority[] = ["low", "medium", "high"];

  return {
    code: `TASK-${customAlphabet("0123456789", 4)()}`,
    title: faker.hacker
      .phrase()
      .replace(/^./, (letter) => letter.toUpperCase()),
    estimatedHours: faker.number.int({ min: 1, max: 24 }),
    status: faker.helpers.shuffle(statusValues)[0] ?? "todo",
    label: faker.helpers.shuffle(labelValues)[0] ?? "bug",
    priority: faker.helpers.shuffle(priorityValues)[0] ?? "low",
    archived: faker.datatype.boolean({ probability: 0.2 }),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getStatusIcon(status: Task["status"]) {
  const statusIcons = {
    canceled: CircleX,
    done: CheckCircle2,
    in_progress: Timer,
    todo: CircleHelp,
  };

  return statusIcons[status] || CircleIcon;
}

export function getPriorityIcon(priority: Task["priority"]) {
  const priorityIcons = {
    high: ArrowUpIcon,
    low: ArrowDownIcon,
    medium: ArrowRightIcon,
  };

  return priorityIcons[priority] || CircleIcon;
}
