/**
 * Custom Test Utilities
 *
 * Custom render functions and test helpers for React components.
 * Provides wrappers for common providers (i18n, theme, etc.)
 *
 * @see https://testing-library.com/docs/react-testing-library/setup
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import type { Dictionary } from '@/components/internationalization/dictionaries'

/**
 * Mock dictionary for testing
 * Provides minimal translations for common keys
 */
export const mockDictionary = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    submit: 'Submit',
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    actions: 'Actions',
    name: 'Name',
    description: 'Description',
    createdAt: 'Created At',
    updatedAt: 'Updated At',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
  },
} as any as Dictionary

/**
 * Custom render options
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Dictionary for i18n testing
   * Defaults to mockDictionary
   */
  dictionary?: Partial<Dictionary>

  /**
   * Language for testing (ar or en)
   * Defaults to 'en'
   */
  lang?: 'ar' | 'en'

  /**
   * Initial route for testing
   */
  route?: string
}

/**
 * Wrapper component for testing
 * Provides common providers needed by components
 */
function TestWrapper({
  children,
  dictionary = mockDictionary,
  lang = 'en',
}: {
  children: ReactNode
  dictionary?: Partial<Dictionary>
  lang?: 'ar' | 'en'
}) {
  // Add provider wrappers here as needed
  // Example: ThemeProvider, I18nProvider, etc.

  return <div lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>{children}</div>
}

/**
 * Custom render function with common providers
 *
 * @example
 * ```tsx
 * import { customRender, screen } from '@/test/utils'
 *
 * customRender(<MyComponent />, {
 *   lang: 'ar',
 *   dictionary: myDictionary
 * })
 *
 * expect(screen.getByText('Save')).toBeInTheDocument()
 * ```
 */
export function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { dictionary, lang, ...renderOptions } = options ?? {}

  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper dictionary={dictionary} lang={lang}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions,
  })
}

/**
 * Re-export everything from React Testing Library
 */
export * from '@testing-library/react'

/**
 * Export custom render as default render
 * This allows you to import { render } from '@/test/utils' and get the custom version
 */
export { customRender as render }
