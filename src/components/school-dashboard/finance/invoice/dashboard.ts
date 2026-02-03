"use server"

import { auth } from "@/auth"
import { InvoiceStatus } from "@prisma/client"

import { db } from "@/lib/db"

// Extended user type that includes the properties added by our auth callbacks
type ExtendedUser = {
  id: string
  email?: string | null
  role?: string
  schoolId?: string | null
}

// Extended session type
type ExtendedSession = {
  user: ExtendedUser
}

export async function getDashboardStats() {
  try {
    const session = (await auth()) as ExtendedSession | null
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const baseWhere = {
      userId: session.user.id,
      schoolId: session.user.schoolId!,
      invoice_date: {
        gte: thirtyDaysAgo,
      },
    } as const

    const [
      invoices,
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      recentInvoices,
    ] = await Promise.all([
      db.userInvoice.findMany({
        where: baseWhere,
        select: {
          invoice_date: true,
          total: true,
          status: true,
        },
      }),
      db.userInvoice.count({ where: baseWhere }),
      db.userInvoice.count({
        where: { ...baseWhere, status: InvoiceStatus.PAID },
      }),
      db.userInvoice.count({
        where: { ...baseWhere, status: InvoiceStatus.UNPAID },
      }),
      db.userInvoice.findMany({
        where: { userId: session.user.id, schoolId: session.user.schoolId! },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        include: {
          from: true,
          to: true,
        },
      }),
    ])

    const totalRevenue = invoices.reduce(
      (prev: number, curr: { total: number }) => prev + curr.total,
      0
    )

    const chartData = invoices.map(
      (invoice: {
        invoice_date: Date
        total: number
        status: InvoiceStatus
      }) => ({
        date: invoice.invoice_date.toISOString().split("T")[0],
        totalRevenue: invoice.total,
        paidRevenue: invoice.status === InvoiceStatus.PAID ? invoice.total : 0,
      })
    )

    return {
      success: true,
      data: {
        totalRevenue,
        totalInvoices,
        paidInvoices,
        unpaidInvoices,
        recentInvoices,
        chartData,
      },
    }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to fetch lab stats" }
  }
}
