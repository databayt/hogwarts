/**
 * Theme Server Actions
 *
 * Server-side operations for theme management.
 */

'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { themePresets, getPresetById } from './presets'
import {
  saveThemeSchema,
  activateThemeSchema,
  deleteThemeSchema,
  applyPresetSchema,
  type ThemeConfigInput,
} from './validation'

/**
 * Get the current user's active theme
 */
export async function getUserTheme() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const theme = await db.userTheme.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    })

    if (!theme) {
      return { theme: null }
    }

    return { theme }
  } catch (error) {
    console.error('Error fetching user theme:', error)
    return { error: 'Failed to fetch theme' }
  }
}

/**
 * Get all themes for the current user
 */
export async function getUserThemes() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const themes = await db.userTheme.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return { themes }
  } catch (error) {
    console.error('Error fetching user themes:', error)
    return { error: 'Failed to fetch themes' }
  }
}

/**
 * Save a new custom theme
 */
export async function saveUserTheme(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Parse form data
    const rawData = {
      name: formData.get('name'),
      themeConfig: JSON.parse(formData.get('themeConfig') as string),
    }

    // Validate
    const validated = saveThemeSchema.parse(rawData)

    // Create new theme
    const theme = await db.userTheme.create({
      data: {
        userId: session.user.id,
        name: validated.name,
        isActive: false,
        isPreset: false,
        themeConfig: validated.themeConfig as any, // Prisma Json type
      },
    })

    revalidatePath('/settings')
    return { success: true, theme }
  } catch (error) {
    console.error('Error saving theme:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to save theme' }
  }
}

/**
 * Update an existing theme
 */
export async function updateUserTheme(themeId: string, formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    // Check ownership
    const existingTheme = await db.userTheme.findUnique({
      where: { id: themeId },
    })

    if (!existingTheme || existingTheme.userId !== session.user.id) {
      return { error: 'Theme not found or unauthorized' }
    }

    // Don't allow updating preset themes
    if (existingTheme.isPreset) {
      return { error: 'Cannot update preset themes' }
    }

    // Parse form data
    const rawData = {
      name: formData.get('name'),
      themeConfig: JSON.parse(formData.get('themeConfig') as string),
    }

    // Validate
    const validated = saveThemeSchema.parse(rawData)

    // Update theme
    const theme = await db.userTheme.update({
      where: { id: themeId },
      data: {
        name: validated.name,
        themeConfig: validated.themeConfig as any,
      },
    })

    revalidatePath('/settings')
    return { success: true, theme }
  } catch (error) {
    console.error('Error updating theme:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to update theme' }
  }
}

/**
 * Activate a theme (set as active)
 */
export async function activateUserTheme(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const rawData = {
      themeId: formData.get('themeId') as string,
    }

    // Validate
    const validated = activateThemeSchema.parse(rawData)

    // Check ownership
    const theme = await db.userTheme.findUnique({
      where: { id: validated.themeId },
    })

    if (!theme || theme.userId !== session.user.id) {
      return { error: 'Theme not found or unauthorized' }
    }

    // Deactivate all other themes and activate this one
    await db.$transaction([
      db.userTheme.updateMany({
        where: {
          userId: session.user.id,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      }),
      db.userTheme.update({
        where: { id: validated.themeId },
        data: {
          isActive: true,
        },
      }),
    ])

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error activating theme:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to activate theme' }
  }
}

/**
 * Delete a custom theme
 */
export async function deleteUserTheme(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const rawData = {
      themeId: formData.get('themeId') as string,
    }

    // Validate
    const validated = deleteThemeSchema.parse(rawData)

    // Check ownership
    const theme = await db.userTheme.findUnique({
      where: { id: validated.themeId },
    })

    if (!theme || theme.userId !== session.user.id) {
      return { error: 'Theme not found or unauthorized' }
    }

    // Don't allow deleting preset themes
    if (theme.isPreset) {
      return { error: 'Cannot delete preset themes' }
    }

    // Don't allow deleting active theme
    if (theme.isActive) {
      return { error: 'Cannot delete active theme. Activate another theme first.' }
    }

    // Delete theme
    await db.userTheme.delete({
      where: { id: validated.themeId },
    })

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error deleting theme:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to delete theme' }
  }
}

/**
 * Apply a preset theme
 * Creates a new user theme based on a preset and activates it
 */
export async function applyPresetTheme(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const rawData = {
      presetId: formData.get('presetId') as string,
    }

    // Validate
    const validated = applyPresetSchema.parse(rawData)

    // Get preset
    const preset = getPresetById(validated.presetId)
    if (!preset) {
      return { error: 'Preset not found' }
    }

    // Check if user already has this preset
    const existingPreset = await db.userTheme.findFirst({
      where: {
        userId: session.user.id,
        isPreset: true,
        name: preset.name,
      },
    })

    let themeId: string

    if (existingPreset) {
      // Use existing preset
      themeId = existingPreset.id
    } else {
      // Create new preset theme
      const newTheme = await db.userTheme.create({
        data: {
          userId: session.user.id,
          name: preset.name,
          isActive: false,
          isPreset: true,
          themeConfig: preset.config as any,
        },
      })
      themeId = newTheme.id
    }

    // Activate the preset
    await db.$transaction([
      db.userTheme.updateMany({
        where: {
          userId: session.user.id,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      }),
      db.userTheme.update({
        where: { id: themeId },
        data: {
          isActive: true,
        },
      }),
    ])

    revalidatePath('/settings')
    return { success: true, themeId }
  } catch (error) {
    console.error('Error applying preset theme:', error)
    if (error instanceof Error) {
      return { error: error.message }
    }
    return { error: 'Failed to apply preset theme' }
  }
}

/**
 * Get all available preset themes
 */
export async function getPresetThemes() {
  return { presets: themePresets }
}
