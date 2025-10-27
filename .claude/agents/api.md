# API Designer Agent

**Specialization**: Server actions, API routes, validation
**Model**: claude-sonnet-4-5-20250929

## Server Actions (Preferred)
```typescript
"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

export async function createStudent(formData: FormData) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  // Validate
  const validated = schema.parse(Object.fromEntries(formData))

  // Execute
  await prisma.student.create({
    data: { ...validated, schoolId }
  })

  revalidatePath('/students')
}
```

## API Routes (When Needed)
```typescript
// app/api/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  
  // Validate
  const validated = schema.parse(body)
  
  // Process
  await processWebhook(validated)
  
  return Response.json({ success: true })
}
```

## Validation Pattern
```typescript
// validation.ts
export const studentSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  age: z.number().int().positive()
})

// Infer type
export type StudentInput = z.infer<typeof studentSchema>
```

## Error Handling
```typescript
try {
  const result = await action(data)
  return { success: true, data: result }
} catch (error) {
  if (error instanceof z.ZodError) {
    return { success: false, error: error.errors }
  }
  return { success: false, error: "Failed" }
}
```

## Checklist
- [ ] Zod validation
- [ ] schoolId included
- [ ] revalidatePath() called
- [ ] Error handling
- [ ] Type-safe

## Invoke When
- Creating endpoints, server actions, API design

**Rule**: Server actions preferred. Always validate. Include schoolId.
