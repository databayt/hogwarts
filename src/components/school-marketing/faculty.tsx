"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useDictionary } from "@/components/internationalization/use-dictionary"

/**
 * Department roll call, not a staff directory -- no portraits, no invented
 * names. Every tenant school has its own teachers; showing stock photos of
 * professors who don't exist here is exactly the failure mode this rebuild
 * removes.
 */
export function Faculty() {
  const { dictionary } = useDictionary()
  const t = dictionary?.marketing?.site?.faculty
  if (!t) return null

  const stats = t.stats ?? []
  const departments = t.departments ?? []

  return (
    <section className="section-y">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="display-2">{t.title}</h2>
        <p className="display-intro mt-4">{t.description}</p>
      </div>

      {stats.length > 0 && (
        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="display-2">{stat.value}</div>
              <div className="text-muted-foreground mt-1 text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {departments.length > 0 && (
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {departments.map((dept, index) => (
            <div key={index} className="border-border rounded-2xl border p-8">
              <h3 className="display-3">{dept.name}</h3>
              <p className="eyebrow text-muted-foreground mt-2">{dept.lead}</p>
              <p className="text-muted-foreground mt-4">{dept.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
