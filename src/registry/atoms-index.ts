/**
 * Atoms Index Registry
 * Maps atom names to their file paths for ComponentPreview code display
 */

export type AtomEntry = {
  name: string
  files: { path: string; type: string }[]
}

export const AtomsIndex: Record<string, AtomEntry> = {
  "activity-goal": {
    name: "activity-goal",
    files: [
      { path: "src/components/atom/activity-goal.tsx", type: "registry:atom" },
    ],
  },
  "agent-heading": {
    name: "agent-heading",
    files: [
      { path: "src/components/atom/agent-heading.tsx", type: "registry:atom" },
    ],
  },
  "ai-previews": {
    name: "ai-previews",
    files: [
      { path: "src/components/atom/ai-previews.tsx", type: "registry:atom" },
    ],
  },
  "ai-response-display": {
    name: "ai-response-display",
    files: [
      {
        path: "src/components/atom/ai-response-display.tsx",
        type: "registry:atom",
      },
    ],
  },
  "animated-button": {
    name: "animated-button",
    files: [
      {
        path: "src/components/atom/animated-button.tsx",
        type: "registry:atom",
      },
    ],
  },
  announcement: {
    name: "announcement",
    files: [
      { path: "src/components/atom/announcement.tsx", type: "registry:atom" },
    ],
  },
  "button-group": {
    name: "button-group",
    files: [
      { path: "src/components/atom/button-group.tsx", type: "registry:atom" },
    ],
  },
  calendar: {
    name: "calendar",
    files: [
      { path: "src/components/atom/calendar.tsx", type: "registry:atom" },
    ],
  },
  card: {
    name: "card",
    files: [{ path: "src/components/atom/card.tsx", type: "registry:atom" }],
  },
  "card-form": {
    name: "card-form",
    files: [
      { path: "src/components/atom/card-form.tsx", type: "registry:atom" },
    ],
  },
  "card-hover-effect": {
    name: "card-hover-effect",
    files: [
      {
        path: "src/components/atom/card-hover-effect.tsx",
        type: "registry:atom",
      },
    ],
  },
  "card-preview": {
    name: "card-preview",
    files: [
      { path: "src/components/atom/card-preview.tsx", type: "registry:atom" },
    ],
  },
  "cards-metric": {
    name: "cards-metric",
    files: [
      { path: "src/components/atom/cards-metric.tsx", type: "registry:atom" },
    ],
  },
  "command-menu": {
    name: "command-menu",
    files: [
      { path: "src/components/atom/command-menu.tsx", type: "registry:atom" },
    ],
  },
  counter: {
    name: "counter",
    files: [{ path: "src/components/atom/counter.tsx", type: "registry:atom" }],
  },
  "divider-with-text": {
    name: "divider-with-text",
    files: [
      {
        path: "src/components/atom/divider-with-text.tsx",
        type: "registry:atom",
      },
    ],
  },
  "encrypted-text": {
    name: "encrypted-text",
    files: [
      { path: "src/components/atom/encrypted-text.tsx", type: "registry:atom" },
    ],
  },
  "expand-button": {
    name: "expand-button",
    files: [
      { path: "src/components/atom/expand-button.tsx", type: "registry:atom" },
    ],
  },
  faceted: {
    name: "faceted",
    files: [{ path: "src/components/atom/faceted.tsx", type: "registry:atom" }],
  },
  "fonts-preview": {
    name: "fonts-preview",
    files: [
      { path: "src/components/atom/fonts-preview.tsx", type: "registry:atom" },
    ],
  },
  "form-field": {
    name: "form-field",
    files: [
      { path: "src/components/atom/form-field.tsx", type: "registry:atom" },
    ],
  },
  "gradient-animation": {
    name: "gradient-animation",
    files: [
      {
        path: "src/components/atom/gradient-animation.tsx",
        type: "registry:atom",
      },
    ],
  },
  "header-section": {
    name: "header-section",
    files: [
      { path: "src/components/atom/header-section.tsx", type: "registry:atom" },
    ],
  },
  icons: {
    name: "icons",
    files: [{ path: "src/components/atom/icons.tsx", type: "registry:atom" }],
  },
  "icons-preview": {
    name: "icons-preview",
    files: [
      { path: "src/components/atom/icons-preview.tsx", type: "registry:atom" },
    ],
  },
  "infinite-cards": {
    name: "infinite-cards",
    files: [
      { path: "src/components/atom/infinite-cards.tsx", type: "registry:atom" },
    ],
  },
  "infinite-slider": {
    name: "infinite-slider",
    files: [
      {
        path: "src/components/atom/infinite-slider.tsx",
        type: "registry:atom",
      },
    ],
  },
  "labeled-input": {
    name: "labeled-input",
    files: [
      { path: "src/components/atom/labeled-input.tsx", type: "registry:atom" },
    ],
  },
  "labeled-select": {
    name: "labeled-select",
    files: [
      { path: "src/components/atom/labeled-select.tsx", type: "registry:atom" },
    ],
  },
  "labeled-textarea": {
    name: "labeled-textarea",
    files: [
      {
        path: "src/components/atom/labeled-textarea.tsx",
        type: "registry:atom",
      },
    ],
  },
  loading: {
    name: "loading",
    files: [{ path: "src/components/atom/loading.tsx", type: "registry:atom" }],
  },
  metric: {
    name: "metric",
    files: [{ path: "src/components/atom/metric.tsx", type: "registry:atom" }],
  },
  "oauth-button": {
    name: "oauth-button",
    files: [
      { path: "src/components/atom/oauth-button.tsx", type: "registry:atom" },
    ],
  },
  "oauth-button-group": {
    name: "oauth-button-group",
    files: [
      {
        path: "src/components/atom/oauth-button-group.tsx",
        type: "registry:atom",
      },
    ],
  },
  "optimized-image": {
    name: "optimized-image",
    files: [
      {
        path: "src/components/atom/optimized-image.tsx",
        type: "registry:atom",
      },
    ],
  },
  "page-actions": {
    name: "page-actions",
    files: [
      { path: "src/components/atom/page-actions.tsx", type: "registry:atom" },
    ],
  },
  "page-actions-preview": {
    name: "page-actions-preview",
    files: [
      {
        path: "src/components/atom/page-actions-preview.tsx",
        type: "registry:atom",
      },
    ],
  },
  "page-header": {
    name: "page-header",
    files: [
      { path: "src/components/atom/page-header.tsx", type: "registry:atom" },
    ],
  },
  "page-heading": {
    name: "page-heading",
    files: [
      { path: "src/components/atom/page-heading.tsx", type: "registry:atom" },
    ],
  },
  "page-nav": {
    name: "page-nav",
    files: [
      { path: "src/components/atom/page-nav.tsx", type: "registry:atom" },
    ],
  },
  "payment-method-selector": {
    name: "payment-method-selector",
    files: [
      {
        path: "src/components/atom/payment-method-selector.tsx",
        type: "registry:atom",
      },
    ],
  },
  "progressive-blur": {
    name: "progressive-blur",
    files: [
      {
        path: "src/components/atom/progressive-blur.tsx",
        type: "registry:atom",
      },
    ],
  },
  "prompt-input": {
    name: "prompt-input",
    files: [
      { path: "src/components/atom/prompt-input.tsx", type: "registry:atom" },
    ],
  },
  reasoning: {
    name: "reasoning",
    files: [
      { path: "src/components/atom/reasoning.tsx", type: "registry:atom" },
    ],
  },
  "report-issue": {
    name: "report-issue",
    files: [
      { path: "src/components/atom/report-issue.tsx", type: "registry:atom" },
    ],
  },
  response: {
    name: "response",
    files: [
      { path: "src/components/atom/response.tsx", type: "registry:atom" },
    ],
  },
  "section-heading": {
    name: "section-heading",
    files: [
      {
        path: "src/components/atom/section-heading.tsx",
        type: "registry:atom",
      },
    ],
  },
  "settings-toggle-row": {
    name: "settings-toggle-row",
    files: [
      {
        path: "src/components/atom/settings-toggle-row.tsx",
        type: "registry:atom",
      },
    ],
  },
  share: {
    name: "share",
    files: [{ path: "src/components/atom/share.tsx", type: "registry:atom" }],
  },
  "simple-marquee": {
    name: "simple-marquee",
    files: [
      { path: "src/components/atom/simple-marquee.tsx", type: "registry:atom" },
    ],
  },
  sortable: {
    name: "sortable",
    files: [
      { path: "src/components/atom/sortable.tsx", type: "registry:atom" },
    ],
  },
  "sortable-preview": {
    name: "sortable-preview",
    files: [
      {
        path: "src/components/atom/sortable-preview.tsx",
        type: "registry:atom",
      },
    ],
  },
  stats: {
    name: "stats",
    files: [{ path: "src/components/atom/stats.tsx", type: "registry:atom" }],
  },
  "sticky-scroll": {
    name: "sticky-scroll",
    files: [
      { path: "src/components/atom/sticky-scroll.tsx", type: "registry:atom" },
    ],
  },
  tabs: {
    name: "tabs",
    files: [{ path: "src/components/atom/tabs.tsx", type: "registry:atom" }],
  },
  theme: {
    name: "theme",
    files: [{ path: "src/components/atom/theme.tsx", type: "registry:atom" }],
  },
  toast: {
    name: "toast",
    files: [{ path: "src/components/atom/toast.tsx", type: "registry:atom" }],
  },
  "two-buttons": {
    name: "two-buttons",
    files: [
      { path: "src/components/atom/two-buttons.tsx", type: "registry:atom" },
    ],
  },
  "two-buttons-preview": {
    name: "two-buttons-preview",
    files: [
      {
        path: "src/components/atom/two-buttons-preview.tsx",
        type: "registry:atom",
      },
    ],
  },
  "user-info-card": {
    name: "user-info-card",
    files: [
      { path: "src/components/atom/user-info-card.tsx", type: "registry:atom" },
    ],
  },
}
