// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Atom components - Compose 2+ UI primitives into reusable patterns
 * Following shadcn/ui architecture hierarchy
 */

// Page layout atoms
export { PageTitle } from "./page-title"

// Toolbar atoms
export { Toolbar, ToolbarGroup, ToolbarSeparator } from "./toolbar"
export { SearchInput } from "./search-input"

// View toggle atoms
export { ViewToggle, ViewToggleSegmented } from "./view-toggle"

// Grid layout atoms (card components are feature-specific in school-dashboard/{feature}/card.tsx)
export { GridContainer } from "./grid-container"
export { EmptyState, GridEmptyState } from "./empty-state"

// Modal atoms (re-export from modal folder)
export { useModal, ModalProvider } from "./modal/context"
export { default as Modal } from "./modal/modal"
export { ModalFormLayout } from "./modal/modal-form-layout"
export { ModalFooter } from "./modal/modal-footer"
