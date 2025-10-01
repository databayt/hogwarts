import { describe, it, expect } from 'vitest'
import { validateTypography } from './typography-validator'

describe('Typography Validator', () => {
  describe('detectHardcodedTypography', () => {
    it('should detect hardcoded text-* classes', () => {
      const html = '<div className="text-2xl font-bold">Title</div>'
      const violations = validateTypography(html)

      expect(violations).toHaveLength(1)
      expect(violations[0]).toMatchObject({
        type: 'hardcoded-typography',
        element: 'div',
        classes: ['text-2xl', 'font-bold'],
        suggestion: 'Use <h3> instead'
      })
    })

    it('should detect font-* classes without text size', () => {
      const html = '<span className="font-semibold">Text</span>'
      const violations = validateTypography(html)

      expect(violations).toHaveLength(1)
      expect(violations[0]).toMatchObject({
        type: 'hardcoded-typography',
        element: 'span',
        classes: ['font-semibold'],
        suggestion: 'Use semantic HTML element'
      })
    })

    it('should detect text-muted-foreground on non-semantic elements', () => {
      const html = '<div className="text-sm text-muted-foreground">Description</div>'
      const violations = validateTypography(html)

      expect(violations).toHaveLength(1)
      expect(violations[0]).toMatchObject({
        type: 'hardcoded-typography',
        element: 'div',
        classes: ['text-sm', 'text-muted-foreground'],
        suggestion: 'Use <p className="muted"> instead'
      })
    })
  })

  describe('validateSemanticHTML', () => {
    it('should pass valid semantic HTML', () => {
      const validCases = [
        '<h1>Main Title</h1>',
        '<h2 className="text-foreground">Section Title</h2>',
        '<p className="muted">Description text</p>',
        '<small>Fine print</small>',
        '<p className="lead">Intro text</p>'
      ]

      validCases.forEach(html => {
        const violations = validateTypography(html)
        expect(violations).toHaveLength(0)
      })
    })

    it('should detect div elements with text content', () => {
      const html = '<div>This is text content</div>'
      const violations = validateTypography(html)

      expect(violations).toHaveLength(1)
      expect(violations[0]).toMatchObject({
        type: 'non-semantic-text',
        element: 'div',
        suggestion: 'Use semantic HTML element like <p>, <h1-h6>, or <small>'
      })
    })

    it('should allow div for containers without direct text', () => {
      const html = '<div className="flex gap-4"><h3>Title</h3><p>Content</p></div>'
      const violations = validateTypography(html)

      expect(violations).toHaveLength(0)
    })
  })

  describe('mappingSuggestions', () => {
    const testCases = [
      {
        input: 'text-4xl font-extrabold',
        expected: 'h1'
      },
      {
        input: 'text-3xl font-bold',
        expected: 'h2'
      },
      {
        input: 'text-2xl font-semibold',
        expected: 'h3'
      },
      {
        input: 'text-xl font-semibold',
        expected: 'h4'
      },
      {
        input: 'text-lg font-semibold',
        expected: 'h5'
      },
      {
        input: 'text-base font-semibold',
        expected: 'h6'
      },
      {
        input: 'text-sm text-muted-foreground',
        expected: 'p className="muted"'
      },
      {
        input: 'text-xs',
        expected: 'small'
      },
      {
        input: 'text-xl',
        expected: 'p className="lead"'
      }
    ]

    testCases.forEach(({ input, expected }) => {
      it(`should suggest ${expected} for ${input}`, () => {
        const html = `<div className="${input}">Text</div>`
        const violations = validateTypography(html)

        expect(violations[0].suggestion).toContain(expected)
      })
    })
  })

  describe('themeColorValidation', () => {
    it('should validate theme colors are used for headings', () => {
      const invalidHeading = '<h2 className="text-gray-900">Title</h2>'
      const violations = validateTypography(invalidHeading)

      expect(violations).toHaveLength(1)
      expect(violations[0]).toMatchObject({
        type: 'hardcoded-color',
        suggestion: 'Use text-foreground for theme-aware colors'
      })
    })

    it('should validate theme colors for secondary text', () => {
      const invalidText = '<p className="text-gray-500">Description</p>'
      const violations = validateTypography(invalidText)

      expect(violations).toHaveLength(1)
      expect(violations[0]).toMatchObject({
        type: 'hardcoded-color',
        suggestion: 'Use text-muted-foreground or className="muted"'
      })
    })

    it('should allow theme-aware colors', () => {
      const validCases = [
        '<h2 className="text-foreground">Title</h2>',
        '<p className="text-muted-foreground">Text</p>',
        '<p className="muted">Text</p>',
        '<a className="text-primary">Link</a>'
      ]

      validCases.forEach(html => {
        const violations = validateTypography(html)
        expect(violations).toHaveLength(0)
      })
    })
  })

  describe('RTL and i18n support', () => {
    it('should validate RTL-friendly typography', () => {
      const rtlFriendly = [
        '<h2 dir="rtl">عنوان</h2>',
        '<p className="muted" dir="rtl">نص وصفي</p>'
      ]

      rtlFriendly.forEach(html => {
        const violations = validateTypography(html)
        expect(violations).toHaveLength(0)
      })
    })

    it('should detect hardcoded directional classes', () => {
      const html = '<div className="text-left">Text</div>'
      const violations = validateTypography(html)

      expect(violations).toHaveLength(1)
      expect(violations[0]).toMatchObject({
        type: 'hardcoded-direction',
        suggestion: 'Use text-start for RTL support'
      })
    })
  })

  describe('accessibility validation', () => {
    it('should validate heading hierarchy', () => {
      const html = `
        <h1>Main</h1>
        <h3>Skipped h2</h3>
      `
      const violations = validateTypography(html)

      expect(violations).toHaveLength(1)
      expect(violations[0]).toMatchObject({
        type: 'heading-hierarchy',
        suggestion: 'Heading levels should not skip (h1 → h2 → h3)'
      })
    })

    it('should detect multiple h1 elements', () => {
      const html = `
        <h1>First Title</h1>
        <h1>Second Title</h1>
      `
      const violations = validateTypography(html)

      expect(violations).toHaveLength(1)
      expect(violations[0]).toMatchObject({
        type: 'multiple-h1',
        suggestion: 'Use only one h1 per page'
      })
    })
  })
})