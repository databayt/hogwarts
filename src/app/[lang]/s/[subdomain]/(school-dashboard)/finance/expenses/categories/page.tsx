// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Expense Categories" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ExpenseCategoriesPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const categories = await db.expenseCategory.findMany({
    where: { schoolId, parentId: null },
    orderBy: { name: "asc" },
    include: {
      children: {
        orderBy: { name: "asc" },
        include: {
          _count: { select: { expenses: true } },
        },
      },
      _count: { select: { expenses: true, allocations: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Expense Categories</h3>
        <Link
          href={`/${lang}/finance/expenses/categories/new`}
          className={buttonVariants()}
        >
          Create Category
        </Link>
      </div>
      {categories.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No expense categories yet.
        </p>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    {category.description && (
                      <p className="text-muted-foreground text-sm">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm">
                      {category._count.expenses} expenses
                    </span>
                    <Badge
                      variant={category.isActive ? "default" : "secondary"}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {category.requiresApproval && (
                      <Badge variant="outline">Requires Approval</Badge>
                    )}
                  </div>
                </div>
                {/* Sub-categories */}
                {category.children.length > 0 && (
                  <div className="ms-6 mt-3 space-y-2">
                    {category.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <p>{child.name}</p>
                        <span className="text-muted-foreground">
                          {child._count.expenses} expenses
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
