/**
 * Generate React component with full boilerplate (types, tests, i18n, etc.)
 * Run: npx tsx scripts/dev-component.ts --name StudentCard --type page [--i18n] [--tests]
 */

import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import chalk from "chalk"
import { Command } from "commander"
import ora from "ora"

const program = new Command()
program
  .requiredOption("-n, --name <name>", "Component name (PascalCase)")
  .requiredOption("-t, --type <type>", "Type: page|feature|atom|ui")
  .option("--i18n", "Include internationalization")
  .option("--tests", "Include test files")
  .option("--stories", "Include Storybook stories")
  .option("--path <path>", "Custom path (default: auto-detect from type)")
  .parse()

const options = program.opts()

function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
}

function getComponentPath(): string {
  if (options.path) return options.path

  const basePath = "src"
  switch (options.type) {
    case "page":
      return join(basePath, "components", "platform", toKebabCase(options.name))
    case "feature":
      return join(basePath, "components", toKebabCase(options.name))
    case "atom":
      return join(basePath, "components", "atom")
    case "ui":
      return join(basePath, "components", "ui")
    default:
      return join(basePath, "components", toKebabCase(options.name))
  }
}

function generateContent(): string {
  return `/**
 * ${options.name} Component
 * Generated: ${new Date().toISOString()}
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ${options.name}Props {
  // Add your props here
}

export function ${options.name}Content({}: ${options.name}Props) {
  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>${options.name}</CardTitle>
          <CardDescription>
            Component description goes here
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Component content */}
          <p className="muted">
            Replace this with your component implementation
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
`
}

function generateTypes(): string {
  return `/**
 * ${options.name} Types
 */

export interface ${options.name}Data {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface ${options.name}FormData {
  // Form fields
}
`
}

function generateActions(): string {
  return `/**
 * ${options.name} Server Actions
 */

'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { ${toCamelCase(options.name)}Schema } from './validation'

export async function create${options.name}(formData: FormData) {
  const session = await auth()
  if (!session?.user?.schoolId) {
    throw new Error('Unauthorized')
  }

  const schoolId = session.user.schoolId

  // Parse and validate
  const data = ${toCamelCase(options.name)}Schema.parse(Object.fromEntries(formData))

  // Create record
  await db.${toCamelCase(options.name)}.create({
    data: {
      ...data,
      schoolId,
    }
  })

  revalidatePath('/${toKebabCase(options.name)}')
}
`
}

function generateValidation(): string {
  return `/**
 * ${options.name} Validation Schemas
 */

import { z } from 'zod'

export const ${toCamelCase(options.name)}Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  // Add more fields
})

export type ${options.name}Schema = z.infer<typeof ${toCamelCase(options.name)}Schema>
`
}

function generateTest(): string {
  return `/**
 * ${options.name} Tests
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ${options.name}Content } from './content'

describe('${options.name}', () => {
  it('renders without crashing', () => {
    render(<${options.name}Content />)
    expect(screen.getByText('${options.name}')).toBeInTheDocument()
  })

  it('displays component description', () => {
    render(<${options.name}Content />)
    expect(screen.getByText(/component description/i)).toBeInTheDocument()
  })
})
`
}

function generateI18n(): { ar: string; en: string } {
  const key = toCamelCase(options.name)
  return {
    ar: JSON.stringify(
      {
        [key]: {
          title: options.name,
          description: "وصف المكون",
          actions: {
            create: "إنشاء",
            edit: "تعديل",
            delete: "حذف",
          },
        },
      },
      null,
      2
    ),
    en: JSON.stringify(
      {
        [key]: {
          title: options.name,
          description: "Component description",
          actions: {
            create: "Create",
            edit: "Edit",
            delete: "Delete",
          },
        },
      },
      null,
      2
    ),
  }
}

function generateREADME(): string {
  return `# ${options.name}

## Overview
Description of ${options.name} component

## Usage
\`\`\`tsx
import { ${options.name}Content } from '@/components/${toKebabCase(options.name)}/content'

<${options.name}Content />
\`\`\`

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| - | - | - | - |

## Features
- [ ] Feature 1
- [ ] Feature 2

## Files
- \`content.tsx\` - Main component
- \`actions.ts\` - Server actions
- \`validation.ts\` - Zod schemas
- \`types.ts\` - TypeScript types
${options.tests ? "- `content.test.tsx` - Tests" : ""}

## Generated
${new Date().toISOString()}
`
}

async function generateComponent() {
  const spinner = ora("Generating component...").start()

  try {
    const componentPath = getComponentPath()

    // Create directory
    if (!existsSync(componentPath)) {
      mkdirSync(componentPath, { recursive: true })
    }

    const files: Array<{ path: string; content: string }> = []

    // Main content file
    files.push({
      path: join(componentPath, "content.tsx"),
      content: generateContent(),
    })

    // Types
    files.push({
      path: join(componentPath, "types.ts"),
      content: generateTypes(),
    })

    // Validation
    files.push({
      path: join(componentPath, "validation.ts"),
      content: generateValidation(),
    })

    // Actions (for features/pages)
    if (options.type === "page" || options.type === "feature") {
      files.push({
        path: join(componentPath, "actions.ts"),
        content: generateActions(),
      })
    }

    // Tests
    if (options.tests) {
      files.push({
        path: join(componentPath, "content.test.tsx"),
        content: generateTest(),
      })
    }

    // README
    files.push({
      path: join(componentPath, "README.md"),
      content: generateREADME(),
    })

    // Write all files
    for (const file of files) {
      spinner.text = `Writing ${file.path}...`
      writeFileSync(file.path, file.content)
    }

    // I18n (if requested)
    if (options.i18n) {
      const i18n = generateI18n()
      spinner.text = "Adding i18n keys..."
      console.log(chalk.yellow("\n⚠️  Add these keys to your dictionaries:\n"))
      console.log(chalk.cyan("Arabic (ar):"))
      console.log(chalk.gray(i18n.ar))
      console.log(chalk.cyan("\nEnglish (en):"))
      console.log(chalk.gray(i18n.en))
    }

    spinner.succeed(chalk.green("Component generated successfully!"))

    console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
    console.log(chalk.bold("✅ Component Generation Complete"))
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))

    console.log(chalk.white("Component:"), chalk.green(options.name))
    console.log(chalk.white("Path:"), chalk.green(componentPath))
    console.log(chalk.white("Type:"), chalk.green(options.type))

    console.log(chalk.white("\nGenerated Files:"))
    files.forEach((f) => {
      console.log(`  ✓ ${f.path}`)
    })

    console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))
  } catch (error) {
    spinner.fail(chalk.red("Generation failed"))
    console.error(error)
    process.exit(1)
  }
}

generateComponent()
