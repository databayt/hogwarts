// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Unified File Block - Browser Module Exports
 */

// Types
export type {
  ViewMode,
  SortField,
  SortDirection,
  FileItem,
  FolderItem,
  BrowserState,
  BrowserActions,
  BrowserConfig,
  UseBrowserReturn,
  ContextMenuItem,
  PreviewState,
  PreviewActions,
} from "./types"

// Hook
export { useBrowser } from "./use-browser"

// Components
export { FileBrowser, type FileBrowserProps } from "./file-browser"
