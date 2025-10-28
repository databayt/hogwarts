import { SchematicClient } from '@schematichq/schematic-typescript-node'

// Initialize with placeholder if env var not set (for build time)
const apiKey = process.env.SCHEMATIC_API_KEY || 'placeholder-api-key'

if (!process.env.SCHEMATIC_API_KEY && typeof window === 'undefined') {
  console.warn('SCHEMATIC_API_KEY environment variable not set - Schematic features will not work')
}

export const schematicClient = new SchematicClient({
  apiKey,
  cacheProviders: {
    flagChecks: [],
  },
})
