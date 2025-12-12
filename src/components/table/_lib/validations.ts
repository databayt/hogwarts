import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import * as z from "zod";
import { flagConfig } from "@/components/table/config/flag";
import type { Task } from "@prisma/client";
import {
  getFiltersStateParser,
  getSortingStateParser,
} from "@/components/table/utils";

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value)
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<Task>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  title: parseAsString.withDefault(""),
  status: parseAsArrayOf(
    parseAsStringEnum(["todo", "in_progress", "done", "canceled"])
  ).withDefault([]),
  priority: parseAsArrayOf(parseAsStringEnum(["low", "medium", "high"])).withDefault([]),
  estimatedHours: parseAsArrayOf(parseAsInteger).withDefault([]),
  createdAt: parseAsArrayOf(parseAsInteger).withDefault([]),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export const createTaskSchema = z.object({
  title: z.string(),
  label: z.enum(["bug", "feature", "enhancement", "documentation"]),
  status: z.enum(["todo", "in_progress", "done", "canceled"]),
  priority: z.enum(["low", "medium", "high"]),
  estimatedHours: z.number().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  label: z.enum(["bug", "feature", "enhancement", "documentation"]).optional(),
  status: z.enum(["todo", "in_progress", "done", "canceled"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  estimatedHours: z.number().optional(),
});

export type GetTasksSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
export type CreateTaskSchema = z.infer<typeof createTaskSchema>;
export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>;
