"use server"

import { revalidatePath } from "next/cache"

export async function saveScheduleConfig(formData: FormData) {
  const termId = formData.get("termId")?.toString() || null
  const workingDays = (formData.getAll("workingDays") || [])
    .map(String)
    .map(Number)
  const lunchAfterStr = formData.get("defaultLunchAfterPeriod")?.toString()
  const defaultLunchAfterPeriod = lunchAfterStr ? Number(lunchAfterStr) : null
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/schedule/config`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ termId, workingDays, defaultLunchAfterPeriod }),
  })
  revalidatePath("/(platform)/timetable")
}
