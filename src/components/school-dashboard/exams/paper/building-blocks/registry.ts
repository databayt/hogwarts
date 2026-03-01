/**
 * Paper Building Block Registry
 *
 * Each block accepts serializable config (storable in CatalogPaperTemplate.blockConfig).
 * Blocks are toggled on/off and configured via the Block Composer UI.
 */

export type BlockType =
  | "header"
  | "footer"
  | "watermark"
  | "logo"
  | "instructions"
  | "student-info"
  | "section-divider"

export interface BlockConfig {
  type: BlockType
  enabled: boolean
  props: Record<string, unknown>
}

export interface BlockMetadata {
  type: BlockType
  name: string
  description: string
  defaultProps: Record<string, unknown>
  configFields: BlockConfigField[]
}

export interface BlockConfigField {
  key: string
  label: string
  type: "string" | "boolean" | "number" | "select"
  options?: { value: string; label: string }[]
  defaultValue: unknown
}

export const BLOCK_REGISTRY: BlockMetadata[] = [
  {
    type: "header",
    name: "Header",
    description: "School name, exam title, date, subject (RTL-aware)",
    defaultProps: {
      showLogo: true,
      showTitle: true,
      showDate: true,
      showAcademicYear: true,
      logoPlacement: "start",
      logoSize: 60,
    },
    configFields: [
      {
        key: "showLogo",
        label: "Show Logo",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "showTitle",
        label: "Show Title",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "showDate",
        label: "Show Date",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "showAcademicYear",
        label: "Academic Year",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "logoPlacement",
        label: "Logo Position",
        type: "select",
        options: [
          { value: "start", label: "Start" },
          { value: "center", label: "Center" },
          { value: "end", label: "End" },
        ],
        defaultValue: "start",
      },
      {
        key: "logoSize",
        label: "Logo Size (px)",
        type: "number",
        defaultValue: 60,
      },
    ],
  },
  {
    type: "footer",
    name: "Footer",
    description: "Page numbers, school motto, confidential notice",
    defaultProps: {
      showPageNumbers: true,
      showTotalPages: true,
      customText: "",
      showConfidential: false,
    },
    configFields: [
      {
        key: "showPageNumbers",
        label: "Page Numbers",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "showTotalPages",
        label: "Total Pages",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "customText",
        label: "Custom Footer Text",
        type: "string",
        defaultValue: "",
      },
      {
        key: "showConfidential",
        label: "Confidential Notice",
        type: "boolean",
        defaultValue: false,
      },
    ],
  },
  {
    type: "watermark",
    name: "Watermark",
    description: "Text watermark (CONFIDENTIAL, DRAFT) or faded logo",
    defaultProps: {
      text: "",
      opacity: 0.1,
      rotation: -30,
      fontSize: 60,
    },
    configFields: [
      {
        key: "text",
        label: "Watermark Text",
        type: "string",
        defaultValue: "",
      },
      { key: "opacity", label: "Opacity", type: "number", defaultValue: 0.1 },
      {
        key: "rotation",
        label: "Rotation (degrees)",
        type: "number",
        defaultValue: -30,
      },
      { key: "fontSize", label: "Font Size", type: "number", defaultValue: 60 },
    ],
  },
  {
    type: "logo",
    name: "Logo",
    description: "Configurable placement (top-left/center/right), RTL-aware",
    defaultProps: {
      placement: "start",
      size: 60,
    },
    configFields: [
      {
        key: "placement",
        label: "Placement",
        type: "select",
        options: [
          { value: "start", label: "Start" },
          { value: "center", label: "Center" },
          { value: "end", label: "End" },
        ],
        defaultValue: "start",
      },
      { key: "size", label: "Size (px)", type: "number", defaultValue: 60 },
    ],
  },
  {
    type: "instructions",
    name: "Instructions",
    description: "Configurable instruction text, rules list",
    defaultProps: {
      showDefault: true,
      customText: "",
      showDuration: true,
      showTotalMarks: true,
    },
    configFields: [
      {
        key: "showDefault",
        label: "Default Instructions",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "customText",
        label: "Custom Instructions",
        type: "string",
        defaultValue: "",
      },
      {
        key: "showDuration",
        label: "Show Duration",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "showTotalMarks",
        label: "Show Total Marks",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  {
    type: "student-info",
    name: "Student Info",
    description: "Name, ID, class, seat number fields",
    defaultProps: {
      showName: true,
      showId: true,
      showClass: true,
      showSeatNumber: false,
      showDate: true,
    },
    configFields: [
      {
        key: "showName",
        label: "Student Name",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "showId",
        label: "Student ID",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "showClass",
        label: "Class/Section",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "showSeatNumber",
        label: "Seat Number",
        type: "boolean",
        defaultValue: false,
      },
      {
        key: "showDate",
        label: "Date Field",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  {
    type: "section-divider",
    name: "Section Divider",
    description: "Separate by question type or difficulty",
    defaultProps: {
      divideBy: "type",
      showSectionTitle: true,
      showMarks: true,
    },
    configFields: [
      {
        key: "divideBy",
        label: "Divide By",
        type: "select",
        options: [
          { value: "type", label: "Question Type" },
          { value: "difficulty", label: "Difficulty" },
          { value: "bloom", label: "Bloom Level" },
        ],
        defaultValue: "type",
      },
      {
        key: "showSectionTitle",
        label: "Section Title",
        type: "boolean",
        defaultValue: true,
      },
      {
        key: "showMarks",
        label: "Section Marks",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
]

/**
 * Get default block config array (all blocks enabled with defaults).
 */
export function getDefaultBlockConfig(): BlockConfig[] {
  return BLOCK_REGISTRY.map((block) => ({
    type: block.type,
    enabled: true,
    props: { ...block.defaultProps },
  }))
}

/**
 * Get a block's metadata by type.
 */
export function getBlockMetadata(type: BlockType): BlockMetadata | undefined {
  return BLOCK_REGISTRY.find((b) => b.type === type)
}
