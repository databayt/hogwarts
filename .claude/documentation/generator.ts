/**
 * Auto-Documentation Generator
 * Automatically generates and maintains documentation across the codebase
 */

import { parse } from '@typescript-eslint/parser'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { glob } from 'glob'
import { compile } from 'handlebars'
import { z } from 'zod'
import path from 'path'

// Configuration
const CONFIG = {
  templatesDir: '.claude/documentation/templates',
  outputDir: 'docs',
  sourcePatterns: {
    api: 'src/**/actions.ts',
    components: 'src/components/**/content.tsx',
    features: 'src/components/platform/*/README.md',
    validation: 'src/**/validation.ts'
  }
}

// Template loaders
async function loadTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
  const templatePath = path.join(CONFIG.templatesDir, `${name}-template.md`)
  const content = await readFile(templatePath, 'utf-8')
  return compile(content)
}

// Source file parsers
async function parseApiFile(filePath: string) {
  const content = await readFile(filePath, 'utf-8')
  const ast = parse(content, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  })

  const functions = []
  const validations = []

  // Extract exported functions
  for (const node of ast.body) {
    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      if (node.declaration.type === 'FunctionDeclaration') {
        functions.push({
          name: node.declaration.id?.name,
          async: node.declaration.async,
          params: node.declaration.params.map(p => p.name),
          body: content.substring(node.declaration.start, node.declaration.end)
        })
      }
    }
  }

  // Extract validation schemas
  const validationPath = filePath.replace('actions.ts', 'validation.ts')
  try {
    const validationContent = await readFile(validationPath, 'utf-8')
    const schemaMatches = validationContent.matchAll(/export const (\w+Schema) = z\.object\(([\s\S]*?)\)/g)

    for (const match of schemaMatches) {
      validations.push({
        name: match[1],
        definition: match[0]
      })
    }
  } catch (e) {
    // No validation file
  }

  return {
    functions,
    validations,
    filePath,
    feature: path.dirname(filePath).split('/').pop()
  }
}

async function parseComponentFile(filePath: string) {
  const content = await readFile(filePath, 'utf-8')

  // Extract component info
  const componentMatch = content.match(/export (default )?function (\w+)/)
  const propsMatch = content.match(/interface (\w+Props) {([\s\S]*?)}/m)

  // Extract imports to identify dependencies
  const imports = []
  const importMatches = content.matchAll(/import .* from ['"]([^'"]+)['"]/g)
  for (const match of importMatches) {
    imports.push(match[1])
  }

  // Check for hooks usage
  const hooks = []
  const hookMatches = content.matchAll(/use(\w+)\(/g)
  for (const match of hookMatches) {
    hooks.push(`use${match[1]}`)
  }

  return {
    name: componentMatch?.[2] || 'Unknown',
    props: propsMatch?.[0] || null,
    imports: imports.filter(i => i.startsWith('@/components')),
    hooks,
    hasServerAction: content.includes('actions.'),
    isMultiTenant: content.includes('schoolId'),
    filePath,
    feature: path.dirname(filePath).split('/').pop()
  }
}

// Documentation generators
async function generateApiDocs(apiData: any) {
  const template = await loadTemplate('api')

  for (const func of apiData.functions) {
    const docData = {
      name: func.name,
      description: extractComment(func.body),
      method: 'POST', // Server actions are POST
      path: `/api/${apiData.feature}/${func.name}`,
      authRequired: true,
      multiTenant: func.body.includes('schoolId'),
      parameters: extractParams(func),
      bodySchema: apiData.validations.find(v => v.name.includes(func.name))?.definition,
      implementation: func.body,
      timestamp: new Date().toISOString(),
      sourceFile: apiData.filePath
    }

    const output = template(docData)
    const outputPath = path.join(CONFIG.outputDir, 'api', `${apiData.feature}.md`)

    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, output)
  }
}

async function generateComponentDocs(componentData: any) {
  const template = await loadTemplate('component')

  const docData = {
    name: componentData.name,
    description: extractComponentDescription(componentData),
    importPath: `@/components/${componentData.feature}/content`,
    propsInterface: componentData.props,
    hasState: componentData.hooks.includes('useState'),
    usesContext: componentData.hooks.includes('useContext'),
    isMultiTenant: componentData.isMultiTenant,
    hasServerAction: componentData.hasServerAction,
    externalDeps: extractExternalDeps(componentData.imports),
    internalDeps: extractInternalDeps(componentData.imports),
    timestamp: new Date().toISOString(),
    sourceFile: componentData.filePath
  }

  const output = template(docData)
  const outputPath = path.join(CONFIG.outputDir, 'components', `${componentData.feature}.md`)

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, output)
}

async function generateFeatureReadme(featurePath: string) {
  const template = await loadTemplate('feature-readme')
  const feature = path.basename(path.dirname(featurePath))

  // Gather all feature data
  const actionsPath = path.join(path.dirname(featurePath), 'actions.ts')
  const contentPath = path.join(path.dirname(featurePath), 'content.tsx')

  const apiData = await parseApiFile(actionsPath).catch(() => null)
  const componentData = await parseComponentFile(contentPath).catch(() => null)

  const docData = {
    featureName: feature.charAt(0).toUpperCase() + feature.slice(1),
    feature,
    description: `Comprehensive ${feature} management system`,
    mainComponent: componentData?.name || `${feature}Content`,
    components: extractComponents(path.dirname(featurePath)),
    actions: apiData?.functions.map(f => ({
      name: f.name,
      purpose: extractPurpose(f.body),
      params: f.params.join(', ')
    })) || [],
    validationSchemas: apiData?.validations.map(v => v.definition).join('\n\n'),
    timestamp: new Date().toISOString()
  }

  const output = template(docData)
  await writeFile(featurePath, output)
}

// Helper functions
function extractComment(code: string): string {
  const match = code.match(/\/\*\*([\s\S]*?)\*\//)
  return match ? match[1].replace(/\* ?/g, '').trim() : 'No description available'
}

function extractComponentDescription(data: any): string {
  // Look for JSDoc comment or default description
  return `${data.name} component for ${data.feature} feature`
}

function extractParams(func: any): any[] {
  return func.params.map(p => ({
    name: p,
    type: 'any', // Would need more advanced parsing
    required: true,
    description: `Parameter ${p}`
  }))
}

function extractPurpose(code: string): string {
  // Extract from function comment or name
  const comment = extractComment(code)
  if (comment !== 'No description available') return comment

  // Infer from function name
  if (code.includes('create')) return 'Create new record'
  if (code.includes('update')) return 'Update existing record'
  if (code.includes('delete')) return 'Delete record'
  if (code.includes('get') || code.includes('find')) return 'Retrieve records'

  return 'Process data'
}

function extractExternalDeps(imports: string[]): any[] {
  return imports
    .filter(i => !i.startsWith('@/') && !i.startsWith('./'))
    .map(i => ({
      package: i.split('/')[0],
      version: 'latest' // Would need package.json parsing
    }))
}

function extractInternalDeps(imports: string[]): any[] {
  return imports
    .filter(i => i.startsWith('@/components'))
    .map(i => ({
      component: path.basename(i),
      purpose: 'Component dependency'
    }))
}

async function extractComponents(featureDir: string): Promise<any[]> {
  const files = await glob(`${featureDir}/*.tsx`)
  return files.map(f => ({
    name: path.basename(f, '.tsx'),
    purpose: `${path.basename(f, '.tsx')} component`
  }))
}

// Main generator
export async function generateDocumentation(type?: string) {
  console.log('🚀 Starting documentation generation...')

  if (!type || type === 'api') {
    const apiFiles = await glob(CONFIG.sourcePatterns.api)
    for (const file of apiFiles) {
      const data = await parseApiFile(file)
      await generateApiDocs(data)
      console.log(`✅ Generated API docs for ${data.feature}`)
    }
  }

  if (!type || type === 'components') {
    const componentFiles = await glob(CONFIG.sourcePatterns.components)
    for (const file of componentFiles) {
      const data = await parseComponentFile(file)
      await generateComponentDocs(data)
      console.log(`✅ Generated component docs for ${data.feature}`)
    }
  }

  if (!type || type === 'features') {
    const features = await glob('src/components/platform/*/')
    for (const feature of features) {
      const readmePath = path.join(feature, 'README.md')
      await generateFeatureReadme(readmePath)
      console.log(`✅ Generated README for ${path.basename(feature)}`)
    }
  }

  console.log('📚 Documentation generation complete!')
}

// CLI interface
if (require.main === module) {
  const type = process.argv[2]
  generateDocumentation(type).catch(console.error)
}