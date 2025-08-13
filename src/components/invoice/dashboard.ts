'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { Status } from "@prisma/client"

export async function getDashboardStats() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const baseWhere = {
      userId: session.user.id,
      schoolId: session.user.schoolId!,
      invoice_date: {
        gte: thirtyDaysAgo
      }
    } as const

    const [
      invoices,
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      recentInvoices
    ] = await Promise.all([
      db.userInvoice.findMany({
        where: baseWhere,
        select: {
          invoice_date: true,
          total: true,
          status: true
        }
      }),
      db.userInvoice.count({ where: baseWhere }),
      db.userInvoice.count({
        where: { ...baseWhere, status: Status.PAID }
      }),
      db.userInvoice.count({
        where: { ...baseWhere, status: Status.UNPAID }
      }),
      db.userInvoice.findMany({
        where: { userId: session.user.id, schoolId: session.user.schoolId! },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        include: {
          from: true,
          to: true
        }
      })
    ])

    const totalRevenue = invoices.reduce((prev: number, curr: { total: number }) => prev + curr.total, 0)

    const chartData = invoices.map((invoice: { invoice_date: Date; total: number; status: Status }) => ({
      date: invoice.invoice_date.toISOString().split('T')[0],
      totalRevenue: invoice.total,
      paidRevenue: invoice.status === Status.PAID ? invoice.total : 0
    }))

    return {
      success: true,
      data: {
        totalRevenue,
        totalInvoices,
        paidInvoices,
        unpaidInvoices,
        recentInvoices,
        chartData
      }
    }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to fetch dashboard stats" }
  }
}


