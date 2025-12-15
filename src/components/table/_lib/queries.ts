import "server-only"

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/components/operator/lib/tenant"
import { filterColumns } from "@/components/table/lib/prisma-filter-columns"
import { unstable_cache } from "@/components/table/lib/unstable-cache"

import type { GetTasksSchema } from "./validations"

export async function getTasks(input: GetTasksSchema) {
  return await unstable_cache(
    async () => {
      try {
        const { schoolId } = await getTenantContext()
        if (!schoolId) {
          return { data: [], pageCount: 0 }
        }
        const skip = (input.page - 1) * input.perPage
        const advancedTable =
          input.filterFlag === "advancedFilters" ||
          input.filterFlag === "commandFilters"

        const advancedWhere = filterColumns({
          filters: input.filters,
          joinOperator: input.joinOperator,
        })

        const basicWhere: Prisma.TaskWhereInput = {}

        // Add basic filters when not using advanced filtering
        if (!advancedTable) {
          if (input.title) {
            basicWhere.title = {
              contains: input.title,
              mode: "insensitive",
            }
          }
          if (input.status.length > 0) {
            basicWhere.status = { in: input.status }
          }
          if (input.priority.length > 0) {
            basicWhere.priority = { in: input.priority }
          }
          if (input.estimatedHours.length > 0) {
            const estimatedHoursCondition: Prisma.FloatFilter = {}
            if (input.estimatedHours[0] !== undefined) {
              estimatedHoursCondition.gte = input.estimatedHours[0]
            }
            if (input.estimatedHours[1] !== undefined) {
              estimatedHoursCondition.lte = input.estimatedHours[1]
            }
            basicWhere.estimatedHours = estimatedHoursCondition
          }
          if (input.createdAt.length > 0) {
            const createdAtCondition: Prisma.DateTimeFilter = {}
            if (input.createdAt[0]) {
              const date = new Date(input.createdAt[0])
              date.setHours(0, 0, 0, 0)
              createdAtCondition.gte = date
            }
            if (input.createdAt[1]) {
              const date = new Date(input.createdAt[1])
              date.setHours(23, 59, 59, 999)
              createdAtCondition.lte = date
            }
            basicWhere.createdAt = createdAtCondition
          }
        }

        const where = {
          ...(advancedTable ? advancedWhere : basicWhere),
          schoolId,
        } satisfies Prisma.TaskWhereInput

        // Build orderBy array
        const orderBy: Prisma.TaskOrderByWithRelationInput[] =
          input.sort.length > 0
            ? input.sort.map((item) => ({
                [item.id]: item.desc ? "desc" : "asc",
              }))
            : [{ createdAt: "asc" }]

        const [data, total] = await db.$transaction([
          db.task.findMany({
            where,
            orderBy,
            skip,
            take: input.perPage,
          }),
          db.task.count({ where }),
        ])

        const pageCount = Math.ceil(total / input.perPage)
        return { data, pageCount }
      } catch {
        return { data: [], pageCount: 0 }
      }
    },
    [JSON.stringify(input)],
    {
      revalidate: 1,
      tags: ["tasks"],
    }
  )()
}

export async function getTaskStatusCounts() {
  return unstable_cache(
    async () => {
      try {
        const { schoolId } = await getTenantContext()
        if (!schoolId) {
          return {
            todo: 0,
            in_progress: 0,
            done: 0,
            canceled: 0,
          }
        }
        const results = await db.task.groupBy({
          by: ["status"],
          _count: {
            status: true,
          },
          where: { schoolId },
        })

        return results.reduce(
          (acc, { status, _count }) => {
            acc[status] = _count.status
            return acc
          },
          {
            todo: 0,
            in_progress: 0,
            done: 0,
            canceled: 0,
          }
        )
      } catch {
        return {
          todo: 0,
          in_progress: 0,
          done: 0,
          canceled: 0,
        }
      }
    },
    ["task-status-counts"],
    {
      revalidate: 3600,
    }
  )()
}

export async function getTaskPriorityCounts() {
  return unstable_cache(
    async () => {
      try {
        const { schoolId } = await getTenantContext()
        if (!schoolId) {
          return {
            low: 0,
            medium: 0,
            high: 0,
          }
        }
        const results = await db.task.groupBy({
          by: ["priority"],
          _count: {
            priority: true,
          },
          where: { schoolId },
        })

        return results.reduce(
          (acc, { priority, _count }) => {
            acc[priority] = _count.priority
            return acc
          },
          {
            low: 0,
            medium: 0,
            high: 0,
          }
        )
      } catch {
        return {
          low: 0,
          medium: 0,
          high: 0,
        }
      }
    },
    ["task-priority-counts"],
    {
      revalidate: 3600,
    }
  )()
}

export async function getEstimatedHoursRange() {
  return unstable_cache(
    async () => {
      try {
        const { schoolId } = await getTenantContext()
        if (!schoolId) {
          return { min: 0, max: 0 }
        }
        const result = await db.task.aggregate({
          _min: {
            estimatedHours: true,
          },
          _max: {
            estimatedHours: true,
          },
          where: { schoolId },
        })

        return {
          min: result._min.estimatedHours ?? 0,
          max: result._max.estimatedHours ?? 0,
        }
      } catch {
        return { min: 0, max: 0 }
      }
    },
    ["estimated-hours-range"],
    {
      revalidate: 3600,
    }
  )()
}
