/**
 * Prompt Documentation Types
 *
 * Types for the dynamic prompt documentation system that reads from .claude/ files
 */

export interface Prompt {
  /** Unique identifier (kebab-case from filename) */
  id: string;

  /** Display name of the prompt */
  name: string;

  /** Brief description of what the prompt does */
  description: string;

  /** Category for organization (Components, Database, Testing, etc.) */
  category: PromptCategory;

  /** Full prompt content/text */
  content: string;

  /** Variables that need to be replaced (e.g., <name>, [path]) */
  variables: string[];

  /** Optional usage example showing how to use the prompt */
  usageExample?: string;

  /** Tags for filtering and search */
  tags: string[];

  /** Source file type (agent or command) */
  source: 'agent' | 'command';

  /** Original file path for reference */
  filePath: string;
}

export type PromptCategory =
  | 'Components'
  | 'Database'
  | 'Testing'
  | 'API'
  | 'Security'
  | 'i18n'
  | 'Git'
  | 'Performance'
  | 'Architecture'
  | 'General';

export interface PromptsByCategory {
  [category: string]: Prompt[];
}

export interface PromptParserResult {
  prompts: Prompt[];
  promptsByCategory: PromptsByCategory;
  categories: PromptCategory[];
}
