/**
 * Generate complete CRUD operations for an entity
 * Run: npx tsx scripts/dev-crud.ts --entity Book --tenant-scoped
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const program = new Command()
program
  .requiredOption('-e, --entity <name>', 'Entity name (PascalCase, e.g., Book)')
  .option('--tenant-scoped', 'Include schoolId scoping')
  .option('--with-tests', 'Generate tests')
  .option('--with-i18n', 'Generate i18n keys')
  .parse()

const options = program.opts()

function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function toPlural(str: string): string {
  // Simple pluralization
  if (str.endsWith('y')) {
    return str.slice(0, -1) + 'ies'
  }
  if (str.endsWith('s')) {
    return str + 'es'
  }
  return str + 's'
}

const entityName = options.entity
const entityCamel = toCamelCase(entityName)
const entityKebab = toKebabCase(entityName)
const entityPlural = toPlural(entityCamel)

function generatePrismaModel(): string {
  return `// Add to prisma/models/${entityKebab}.prisma

model ${entityName} {
  id        String   @id @default(cuid())
  name      String
  ${options.tenantScoped ? 'schoolId  String' : ''}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  ${options.tenantScoped ? `school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)` : ''}

  ${options.tenantScoped ? '@@index([schoolId])' : ''}
  @@map("${entityPlural}")
}

${options.tenantScoped ? `
// Don't forget to add to School model:
model School {
  // ... existing fields
  ${entityPlural}  ${entityName}[]
}
` : ''}
`
}

function generateActions(): string {
  const tenantCheck = options.tenantScoped ? `
  const session = await auth()
  if (!session?.user?.schoolId) {
    throw new Error('Unauthorized')
  }
  const schoolId = session.user.schoolId
` : ''

  const tenantScope = options.tenantScoped ? 'schoolId, ' : ''
  const tenantWhere = options.tenantScoped ? 'where: { schoolId },' : ''

  return `/**
 * ${entityName} Server Actions
 */

'use server'

${options.tenantScoped ? "import { auth } from '@/auth'" : ''}
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ${entityCamel}Schema } from './validation'
import type { ${entityName} } from '@prisma/client'

export async function get${entityPlural}(): Promise<${entityName}[]> {
  ${tenantCheck}
  return await db.${entityCamel}.findMany({
    ${tenantWhere}
    orderBy: { createdAt: 'desc' }
  })
}

export async function get${entityName}(id: string): Promise<${entityName} | null> {
  ${tenantCheck}
  return await db.${entityCamel}.findUnique({
    where: { id${options.tenantScoped ? ', schoolId' : ''} }
  })
}

export async function create${entityName}(formData: FormData) {
  ${tenantCheck}

  const data = ${entityCamel}Schema.parse(Object.fromEntries(formData))

  await db.${entityCamel}.create({
    data: {
      ...data,
      ${tenantScope}
    }
  })

  revalidatePath('/${entityKebab}')
  redirect('/${entityKebab}')
}

export async function update${entityName}(id: string, formData: FormData) {
  ${tenantCheck}

  const data = ${entityCamel}Schema.parse(Object.fromEntries(formData))

  await db.${entityCamel}.update({
    where: { id${options.tenantScoped ? ', schoolId' : ''} },
    data
  })

  revalidatePath('/${entityKebab}')
  redirect('/${entityKebab}')
}

export async function delete${entityName}(id: string) {
  ${tenantCheck}

  await db.${entityCamel}.delete({
    where: { id${options.tenantScoped ? ', schoolId' : ''} }
  })

  revalidatePath('/${entityKebab}')
}
`
}

function generateValidation(): string {
  return `/**
 * ${entityName} Validation Schemas
 */

import { z } from 'zod'

export const ${entityCamel}Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  // Add more fields as needed
})

export type ${entityName}Schema = z.infer<typeof ${entityCamel}Schema>
`
}

function generateForm(): string {
  return `/**
 * ${entityName} Form Component
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ${entityCamel}Schema, type ${entityName}Schema } from './validation'
import type { ${entityName} } from '@prisma/client'

interface ${entityName}FormProps {
  ${entityCamel}?: ${entityName}
  onSubmit: (data: FormData) => Promise<void>
}

export function ${entityName}Form({ ${entityCamel}, onSubmit }: ${entityName}FormProps) {
  const form = useForm<${entityName}Schema>({
    resolver: zodResolver(${entityCamel}Schema),
    defaultValues: {
      name: ${entityCamel}?.name || '',
    }
  })

  async function handleSubmit(data: ${entityName}Schema) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value))
    })
    await onSubmit(formData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </Form>
  )
}
`
}

function generateContent(): string {
  return `/**
 * ${entityName} List Component
 */

import { get${entityPlural} } from './actions'
import { ${entityName}Table } from './table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export async function ${entityName}Content() {
  const ${entityPlural} = await get${entityPlural}()

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>${toPlural(entityName)}</h2>
          <p className="muted">
            Manage your ${entityPlural}
          </p>
        </div>
        <Button asChild>
          <Link href="/${entityKebab}/new">
            Add ${entityName}
          </Link>
        </Button>
      </div>

      <${entityName}Table data={${entityPlural}} />
    </div>
  )
}
`
}

function generateTable(): string {
  return `/**
 * ${entityName} Table Component
 */

'use client'

import { DataTable } from '@/components/table/data-table/data-table'
import { type ${entityName} } from '@prisma/client'
import { type ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { delete${entityName} } from './actions'
import Link from 'next/link'

const columns: ColumnDef<${entityName}>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={\`/${entityKebab}/\${row.original.id}/edit\`}>
            Edit
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            if (confirm('Are you sure?')) {
              await delete${entityName}(row.original.id)
            }
          }}
        >
          Delete
        </Button>
      </div>
    ),
  },
]

interface ${entityName}TableProps {
  data: ${entityName}[]
}

export function ${entityName}Table({ data }: ${entityName}TableProps) {
  return <DataTable columns={columns} data={data} />
}
`
}

async function generateCRUD() {
  const spinner = ora('Generating CRUD operations...').start()

  try {
    const outputDir = `generated-${entityKebab}`
    const { mkdirSync, existsSync } = require('fs')
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    const files = [
      { name: 'prisma-model.txt', content: generatePrismaModel() },
      { name: 'actions.ts', content: generateActions() },
      { name: 'validation.ts', content: generateValidation() },
      { name: 'form.tsx', content: generateForm() },
      { name: 'content.tsx', content: generateContent() },
      { name: 'table.tsx', content: generateTable() },
    ]

    for (const file of files) {
      const filePath = join(outputDir, file.name)
      spinner.text = `Writing ${file.name}...`
      writeFileSync(filePath, file.content)
    }

    spinner.succeed(chalk.green('CRUD operations generated!'))

    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    console.log(chalk.bold('✅ CRUD Generation Complete'))
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    console.log(chalk.white('Entity:'), chalk.green(entityName))
    console.log(chalk.white('Output:'), chalk.green(outputDir))
    console.log(chalk.white('Tenant Scoped:'), chalk.green(options.tenantScoped ? 'Yes' : 'No'))

    console.log(chalk.white('\nGenerated Files:'))
    files.forEach(f => console.log(`  ✓ ${f.name}`))

    console.log(chalk.yellow('\n📋 Next Steps:\n'))
    console.log(chalk.gray('1. Copy Prisma model to appropriate schema file'))
    console.log(chalk.gray('2. Run: pnpm prisma generate'))
    console.log(chalk.gray('3. Create migration: pnpm prisma migrate dev'))
    console.log(chalk.gray(`4. Move files to src/components/${entityKebab}/`))
    console.log(chalk.gray(`5. Create routes in src/app/[lang]/${entityKebab}/`))

    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

  } catch (error) {
    spinner.fail(chalk.red('Generation failed'))
    console.error(error)
    process.exit(1)
  }
}

generateCRUD()
