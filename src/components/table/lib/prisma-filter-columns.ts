import type { Prisma } from "@prisma/client"
import { addDays, endOfDay, startOfDay } from "date-fns"

import type {
  ExtendedColumnFilter,
  JoinOperator,
} from "@/components/table/types/data-table"

// Type for Prisma where conditions
type WhereCondition = Prisma.TaskWhereInput

/**
 * Convert filters to Prisma where conditions for Task model
 */
export function filterColumns({
  filters,
  joinOperator,
}: {
  filters: ExtendedColumnFilter<unknown>[]
  joinOperator: JoinOperator
}): WhereCondition | undefined {
  const conditions = filters.map((filter): WhereCondition | undefined => {
    const columnId = filter.id as keyof Prisma.TaskWhereInput

    switch (filter.operator) {
      case "iLike":
        if (filter.variant === "text" && typeof filter.value === "string") {
          return {
            [columnId]: {
              contains: filter.value,
              mode: "insensitive",
            },
          }
        }
        return undefined

      case "notILike":
        if (filter.variant === "text" && typeof filter.value === "string") {
          return {
            [columnId]: {
              not: {
                contains: filter.value,
                mode: "insensitive",
              },
            },
          }
        }
        return undefined

      case "eq":
        if (filter.variant === "date" || filter.variant === "dateRange") {
          const date = new Date(Number(filter.value))
          date.setHours(0, 0, 0, 0)
          const end = new Date(date)
          end.setHours(23, 59, 59, 999)
          return {
            [columnId]: {
              gte: date,
              lte: end,
            },
          }
        }
        if (
          typeof filter.value === "boolean" ||
          typeof filter.value === "string"
        ) {
          return {
            [columnId]: { equals: filter.value },
          }
        }
        return undefined

      case "ne":
        if (filter.variant === "date" || filter.variant === "dateRange") {
          const date = new Date(Number(filter.value))
          date.setHours(0, 0, 0, 0)
          const end = new Date(date)
          end.setHours(23, 59, 59, 999)
          return {
            OR: [{ [columnId]: { lt: date } }, { [columnId]: { gt: end } }],
          }
        }
        return {
          [columnId]: { not: { equals: filter.value } },
        }

      case "inArray":
        if (Array.isArray(filter.value)) {
          return {
            [columnId]: { in: filter.value },
          }
        }
        return undefined

      case "notInArray":
        if (Array.isArray(filter.value)) {
          return {
            [columnId]: { notIn: filter.value },
          }
        }
        return undefined

      case "lt":
        if (filter.variant === "number" || filter.variant === "range") {
          return {
            [columnId]: { lt: filter.value },
          }
        }
        if (filter.variant === "date" && typeof filter.value === "string") {
          const date = new Date(Number(filter.value))
          date.setHours(23, 59, 59, 999)
          return {
            [columnId]: { lt: date },
          }
        }
        return undefined

      case "lte":
        if (filter.variant === "number" || filter.variant === "range") {
          return {
            [columnId]: { lte: filter.value },
          }
        }
        if (filter.variant === "date" && typeof filter.value === "string") {
          const date = new Date(Number(filter.value))
          date.setHours(23, 59, 59, 999)
          return {
            [columnId]: { lte: date },
          }
        }
        return undefined

      case "gt":
        if (filter.variant === "number" || filter.variant === "range") {
          return {
            [columnId]: { gt: filter.value },
          }
        }
        if (filter.variant === "date" && typeof filter.value === "string") {
          const date = new Date(Number(filter.value))
          date.setHours(0, 0, 0, 0)
          return {
            [columnId]: { gt: date },
          }
        }
        return undefined

      case "gte":
        if (filter.variant === "number" || filter.variant === "range") {
          return {
            [columnId]: { gte: filter.value },
          }
        }
        if (filter.variant === "date" && typeof filter.value === "string") {
          const date = new Date(Number(filter.value))
          date.setHours(0, 0, 0, 0)
          return {
            [columnId]: { gte: date },
          }
        }
        return undefined

      case "isBetween":
        if (
          (filter.variant === "number" || filter.variant === "range") &&
          Array.isArray(filter.value) &&
          filter.value.length === 2
        ) {
          return {
            [columnId]: {
              gte: filter.value[0],
              lte: filter.value[1],
            },
          }
        }
        if (
          (filter.variant === "date" || filter.variant === "dateRange") &&
          Array.isArray(filter.value) &&
          filter.value.length === 2
        ) {
          const startDate = new Date(Number(filter.value[0]))
          startDate.setHours(0, 0, 0, 0)
          const endDate = new Date(Number(filter.value[1]))
          endDate.setHours(23, 59, 59, 999)
          return {
            [columnId]: {
              gte: startDate,
              lte: endDate,
            },
          }
        }
        return undefined

      case "isRelativeToToday":
        if (
          (filter.variant === "date" || filter.variant === "dateRange") &&
          typeof filter.value === "string"
        ) {
          const today = new Date()
          const [amount, unit] = filter.value.split(" ") ?? []
          let startDate: Date
          let endDate: Date

          if (!amount || !unit) return undefined

          switch (unit) {
            case "days":
              startDate = startOfDay(addDays(today, Number.parseInt(amount)))
              endDate = endOfDay(startDate)
              break
            case "weeks":
              startDate = startOfDay(
                addDays(today, Number.parseInt(amount) * 7)
              )
              endDate = endOfDay(addDays(startDate, 6))
              break
            case "months":
              startDate = startOfDay(
                addDays(today, Number.parseInt(amount) * 30)
              )
              endDate = endOfDay(addDays(startDate, 29))
              break
            default:
              return undefined
          }

          return {
            [columnId]: {
              gte: startDate,
              lte: endDate,
            },
          }
        }
        return undefined

      case "isEmpty":
        return {
          OR: [{ [columnId]: null }, { [columnId]: { equals: "" } }],
        }

      case "isNotEmpty":
        return {
          AND: [
            { [columnId]: { not: null } },
            { [columnId]: { not: { equals: "" } } },
          ],
        }

      default:
        throw new Error(`Unsupported operator: ${filter.operator}`)
    }
  })

  const validConditions = conditions.filter(
    (condition): condition is WhereCondition => condition !== undefined
  )

  if (validConditions.length === 0) return undefined

  if (validConditions.length === 1) return validConditions[0]

  return joinOperator === "and"
    ? { AND: validConditions }
    : { OR: validConditions }
}
