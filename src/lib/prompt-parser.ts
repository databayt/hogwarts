/**
 * Prompt Parser - Agent & Command Documentation Generator
 *
 * PURPOSE: Extracts prompt definitions from .claude/agents/ and .claude/commands/
 * directories and builds a searchable documentation index.
 *
 * USES: Provides context for documentation website and Agent Reference page
 * Enables developers to search available agents, commands, and examples
 *
 * DATA SOURCES:
 * - Agents: .claude/agents/*.md files (Specialization: metadata in content)
 * - Commands: .claude/commands/*.md files (YAML frontmatter for metadata)
 *
 * KEY PATTERNS:
 * - categorizePrompt(): Infers category from filename + content keywords
 * - extractVariables(): Finds <>, [], {}, and $1-$9 placeholders
 * - extractTags(): Builds tag cloud from technical keywords
 * - parseFrontmatter(): YAML key:value parsing for commands
 * - extractUsageExample(): Pulls first code block as example
 *
 * CATEGORIZATION (10 categories):
 * Components, Database, Testing, API, Security, i18n,
 * Git, Performance, Architecture, General
 *
 * CONSTRAINTS & GOTCHAS:
 * - Frontmatter parsing is basic (no nested YAML support)
 * - Variable extraction uses simple regex (doesn't handle nesting)
 * - Tags are case-insensitive, category is lowercase
 * - Files must have .md extension (case-sensitive)
 * - getAllPrompts() is called on every request (consider caching)
 *
 * PERFORMANCE:
 * - Recursive directory scan only at build time or on demand
 * - Linear search through all prompts (searchPrompts is O(n))
 * - Consider caching in production for large prompt libraries
 */

import fs from 'fs';
import path from 'path';
import type {
  Prompt,
  PromptCategory,
  PromptsByCategory,
  PromptParserResult,
} from '@/components/docs/prompt-types';

const CLAUDE_DIR = path.join(process.cwd(), '.claude');
const AGENTS_DIR = path.join(CLAUDE_DIR, 'agents');
const COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands');

/**
 * Extract variables from prompt content
 * Looks for patterns like <name>, [path], {component}, $1, $2, etc.
 * WHY: Shows users what parameters each agent/command accepts
 * Example: /component <name> shows users need to provide name
 */
function extractVariables(content: string): string[] {
  const variables = new Set<string>();

  // WHY: Support multiple bracket styles for different use cases
  // <variable> = angle brackets (agent parameters)
  // [variable] = square brackets (optional params)
  // {variable} = curly braces (config params)
  // $N = positional args

  // Match <variable>
  const angleBrackets = content.match(/<([a-zA-Z_-]+)>/g);
  if (angleBrackets) {
    angleBrackets.forEach((match) => variables.add(match));
  }

  // Match [variable]
  const squareBrackets = content.match(/\[([a-zA-Z_-]+)\]/g);
  if (squareBrackets) {
    squareBrackets.forEach((match) => variables.add(match));
  }

  // Match {variable}
  const curlyBraces = content.match(/\{([a-zA-Z_-]+)\}/g);
  if (curlyBraces) {
    curlyBraces.forEach((match) => variables.add(match));
  }

  // Match $1, $2, etc.
  const dollarVars = content.match(/\$\d+/g);
  if (dollarVars) {
    dollarVars.forEach((match) => variables.add(match));
  }

  return Array.from(variables).sort();
}

/**
 * Categorize prompt based on filename and content
 */
function categorizePrompt(
  filename: string,
  content: string
): PromptCategory {
  const lower = filename.toLowerCase() + ' ' + content.toLowerCase();

  if (
    lower.includes('component') ||
    lower.includes('react') ||
    lower.includes('ui')
  ) {
    return 'Components';
  }
  if (
    lower.includes('database') ||
    lower.includes('prisma') ||
    lower.includes('migration')
  ) {
    return 'Database';
  }
  if (lower.includes('test') || lower.includes('vitest')) {
    return 'Testing';
  }
  if (
    lower.includes('api') ||
    lower.includes('server') ||
    lower.includes('action')
  ) {
    return 'API';
  }
  if (
    lower.includes('security') ||
    lower.includes('auth') ||
    lower.includes('multi-tenant')
  ) {
    return 'Security';
  }
  if (lower.includes('i18n') || lower.includes('translation')) {
    return 'i18n';
  }
  if (lower.includes('git') || lower.includes('github')) {
    return 'Git';
  }
  if (
    lower.includes('performance') ||
    lower.includes('optimization')
  ) {
    return 'Performance';
  }
  if (
    lower.includes('architecture') ||
    lower.includes('pattern') ||
    lower.includes('orchestrate')
  ) {
    return 'Architecture';
  }

  return 'General';
}

/**
 * Extract tags from content
 */
function extractTags(content: string, category: string): string[] {
  const tags = new Set<string>([category.toLowerCase()]);

  const keywords = [
    'nextjs',
    'react',
    'prisma',
    'typescript',
    'tailwind',
    'server action',
    'multi-tenant',
    'i18n',
    'rtl',
    'auth',
    'security',
    'performance',
    'testing',
    'vitest',
    'playwright',
    'git',
    'github',
  ];

  keywords.forEach((keyword) => {
    if (content.toLowerCase().includes(keyword)) {
      tags.add(keyword);
    }
  });

  return Array.from(tags).sort();
}

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const [, frontmatterText, body] = match;
  const frontmatter: Record<string, unknown> = {};

  frontmatterText.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      frontmatter[key.trim()] =
        value === 'true' ? true : value === 'false' ? false : value;
    }
  });

  return { frontmatter, body };
}

/**
 * Extract usage example from agent file
 */
function extractUsageExample(content: string): string | undefined {
  // Look for "Key Patterns" or "Example" sections
  const patternsMatch = content.match(
    /## Key Patterns\n\n([\s\S]*?)(?=\n## |$)/
  );
  if (patternsMatch) {
    // Get first code block
    const codeBlockMatch = patternsMatch[1].match(/```[\s\S]*?```/);
    if (codeBlockMatch) {
      return codeBlockMatch[0];
    }
  }

  // Look for any code block
  const codeBlockMatch = content.match(/```[\s\S]*?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[0];
  }

  return undefined;
}

/**
 * Parse agent file
 */
function parseAgentFile(filePath: string): Prompt | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath, '.md');

    // Extract title
    const titleMatch = content.match(/^# (.+)$/m);
    const name = titleMatch ? titleMatch[1] : filename;

    // Extract description (specialization line)
    const descMatch = content.match(/\*\*Specialization\*\*:\s*(.+)$/m);
    const description = descMatch
      ? descMatch[1]
      : 'Specialized agent for ' + filename;

    const category = categorizePrompt(filename, content);
    const variables = extractVariables(content);
    const tags = extractTags(content, category);
    const usageExample = extractUsageExample(content);

    return {
      id: filename,
      name,
      description,
      category,
      content,
      variables,
      usageExample,
      tags,
      source: 'agent',
      filePath,
    };
  } catch (error) {
    console.error(`Error parsing agent file ${filePath}:`, error);
    return null;
  }
}

/**
 * Parse command file
 */
function parseCommandFile(filePath: string): Prompt | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath, '.md');

    const { frontmatter, body } = parseFrontmatter(content);

    const name = `/${filename}`;
    const description =
      (frontmatter.description as string) ||
      'Command for ' + filename;

    const category = categorizePrompt(filename, body);
    const variables = extractVariables(body);
    const tags = extractTags(body, category);

    // Use the full body as usage example for commands
    const usageExample = body.trim();

    return {
      id: `command-${filename}`,
      name,
      description,
      category,
      content: body,
      variables,
      usageExample,
      tags,
      source: 'command',
      filePath,
    };
  } catch (error) {
    console.error(`Error parsing command file ${filePath}:`, error);
    return null;
  }
}

/**
 * Get all prompts from .claude/ directory
 */
export function getAllPrompts(): PromptParserResult {
  const prompts: Prompt[] = [];

  // Parse agent files
  if (fs.existsSync(AGENTS_DIR)) {
    const agentFiles = fs
      .readdirSync(AGENTS_DIR)
      .filter((file) => file.endsWith('.md'));

    agentFiles.forEach((file) => {
      const filePath = path.join(AGENTS_DIR, file);
      const prompt = parseAgentFile(filePath);
      if (prompt) {
        prompts.push(prompt);
      }
    });
  }

  // Parse command files
  if (fs.existsSync(COMMANDS_DIR)) {
    const commandFiles = fs
      .readdirSync(COMMANDS_DIR)
      .filter((file) => file.endsWith('.md'));

    commandFiles.forEach((file) => {
      const filePath = path.join(COMMANDS_DIR, file);
      const prompt = parseCommandFile(filePath);
      if (prompt) {
        prompts.push(prompt);
      }
    });
  }

  // Group by category
  const promptsByCategory: PromptsByCategory = {};
  prompts.forEach((prompt) => {
    if (!promptsByCategory[prompt.category]) {
      promptsByCategory[prompt.category] = [];
    }
    promptsByCategory[prompt.category].push(prompt);
  });

  // Get unique categories
  const categories = Array.from(
    new Set(prompts.map((p) => p.category))
  ).sort() as PromptCategory[];

  return {
    prompts,
    promptsByCategory,
    categories,
  };
}

/**
 * Get prompt by ID
 */
export function getPromptById(id: string): Prompt | null {
  const { prompts } = getAllPrompts();
  return prompts.find((p) => p.id === id) || null;
}

/**
 * Search prompts by query
 */
export function searchPrompts(query: string): Prompt[] {
  const { prompts } = getAllPrompts();
  const lowerQuery = query.toLowerCase();

  return prompts.filter(
    (prompt) =>
      prompt.name.toLowerCase().includes(lowerQuery) ||
      prompt.description.toLowerCase().includes(lowerQuery) ||
      prompt.tags.some((tag) => tag.includes(lowerQuery)) ||
      prompt.content.toLowerCase().includes(lowerQuery)
  );
}
