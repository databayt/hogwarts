// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Types
export type {
  ExamPaperData,
  ExamWithDetails,
  FooterSectionProps,
  HeaderSectionProps,
  InstructionsSectionProps,
  PaperMetadata,
  PaperTheme,
  QuestionForPaper,
  QuestionOption,
  QuestionSectionProps,
  QuestionWithLinesProps,
  SchoolForPaper,
  StudentInfoSectionProps,
  TemplateEntry,
} from "./types"

// Config
export {
  ANSWER_LINE_CONFIG,
  BLANK_SLOT_CONFIG,
  BUBBLE_CONFIG,
  CHECKBOX_CONFIG,
  createSchoolTheme,
  DEFAULT_INSTRUCTIONS,
  FONTS,
  getThemePreset,
  MCQ_OPTION_LABELS,
  PAGE_DIMENSIONS,
  PAGE_MARGINS,
  POINTS_LABEL,
  QUESTION_TYPE_LABELS,
  SECTION_LABELS,
  TF_LABELS,
  THEME_CLASSIC,
  THEME_FORMAL,
  THEME_MODERN,
  VERSION_CODES,
  withLocale,
} from "./config"

// Atoms
export {
  AlignmentMarker,
  AnswerLine,
  BlankSlot,
  Bubble,
  Checkbox,
  Divider,
  FieldLine,
  LogoBlock,
  OptionLabel,
  PointsBadge,
  QuestionNumber,
  TimingMark,
  TypeLabel,
  Watermark,
} from "./atom"

// Question Sections
export { EssayContent } from "./essay"
export { FillBlankContent } from "./fill-blank"
export { MatchingContent } from "./matching"
export { MultipleChoiceContent } from "./multiple-choice"
export { OrderingContent } from "./ordering"
export { ShortAnswerContent } from "./short-answer"
export { TrueFalseContent } from "./true-false"

// Question Dispatcher
export { QuestionRenderer } from "./question-renderer"
export { QuestionGroup } from "./question-group"

// Header Sections
export { MinimalHeader, MinistryHeader, StandardHeader } from "./header"

// Footer Sections
export { DisclaimerFooter, StandardFooter } from "./footer"

// Student Info Sections
export { BubbleIdStudentInfo, StandardStudentInfo } from "./student-info"

// Instructions Sections
export { CompactInstructions, StandardInstructions } from "./instructions"

// Answer Sheet Sections
export { OmrAnswerSheet, StandardAnswerSheet } from "./answer-sheet"

// Cover Sections
export { StandardCover, TableOfContents } from "./cover"

// Layouts
export { BookletLayout } from "./layouts/booklet"
export { SingleColumnLayout } from "./layouts/single-column"
export { TwoColumnLayout } from "./layouts/two-column"

// Regional Presets
export { detectRegionPreset, getRegionPreset } from "./presets"
export type { RegionPreset } from "./presets"

// Validation
export { paperThemeSchema, regionPresetSchema } from "./validation"

// Full Template Components
export { ClassicTemplate } from "./classic"
export { ModernTemplate } from "./modern"
export { FormalTemplate } from "./formal"
export { CustomTemplate } from "./custom"
