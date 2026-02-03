import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// FORMAT DATE TIME
export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }

  const dateDayOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
    day: "numeric",
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }

  const formattedDateTime: string = new Date(dateString).toLocaleString(
    "en-US",
    dateTimeOptions
  )

  const formattedDateDay: string = new Date(dateString).toLocaleString(
    "en-US",
    dateDayOptions
  )

  const formattedDate: string = new Date(dateString).toLocaleString(
    "en-US",
    dateOptions
  )

  const formattedTime: string = new Date(dateString).toLocaleString(
    "en-US",
    timeOptions
  )

  return {
    dateTime: formattedDateTime,
    dateDay: formattedDateDay,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  }
}

export function formatAmount(amount: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  })

  return formatter.format(amount)
}

export const parseStringify = (value: any) => JSON.parse(JSON.stringify(value))

export const removeSpecialCharacters = (value: string) => {
  return value.replace(/[^\w\s]/gi, "")
}

export function getAccountTypeColors(type: string) {
  switch (type) {
    case "depository":
      return {
        bg: "bg-blue-25",
        lightBg: "bg-blue-100",
        title: "text-blue-900",
        subText: "text-blue-700",
      }

    case "credit":
      return {
        bg: "bg-success-25",
        lightBg: "bg-success-100",
        title: "text-success-900",
        subText: "text-success-700",
      }

    default:
      return {
        bg: "bg-green-25",
        lightBg: "bg-green-100",
        title: "text-green-900",
        subText: "text-green-700",
      }
  }
}

export function countTransactionCategories(
  transactions: any[]
): { name: string; count: number; totalCount: number }[] {
  const categoryCounts: { [category: string]: number } = {}
  let totalCount = 0

  transactions?.forEach((transaction) => {
    const category = transaction.category

    if (categoryCounts[category]) {
      categoryCounts[category]++
    } else {
      categoryCounts[category] = 1
    }

    totalCount++
  })

  const aggregatedCategories = Object.keys(categoryCounts).map((category) => ({
    name: category,
    count: categoryCounts[category],
    totalCount,
  }))

  aggregatedCategories.sort((a, b) => b.count - a.count)

  return aggregatedCategories
}

export function extractCustomerIdFromUrl(url: string) {
  const parts = url.split("/")
  const customerId = parts[parts.length - 1]
  return customerId
}

export function encryptId(id: string) {
  return btoa(id)
}

export function decryptId(id: string) {
  return atob(id)
}

export const getTransactionStatus = (date: Date) => {
  const today = new Date()
  const twoDaysAgo = new Date(today)
  twoDaysAgo.setDate(today.getDate() - 2)

  return date > twoDaysAgo ? "Processing" : "Success"
}
