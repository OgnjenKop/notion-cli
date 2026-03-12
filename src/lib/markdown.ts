import * as fs from 'fs';
import * as path from 'path';
import { Block, Page, RichTextItem } from './types';

function escapeInlineMarkdown(text: string): string {
  return text.replace(/([\\`*_{}[\]()!])/g, '\\$1');
}

function escapeLineStartMarkdown(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const match = line.match(/^(\s*)(.*)$/);
      if (!match) {
        return line;
      }
      const [, leading, rest] = match;
      if (!rest) {
        return line;
      }
      if (
        rest.startsWith('#') ||
        rest.startsWith('>') ||
        rest.startsWith('-') ||
        rest.startsWith('*') ||
        rest.startsWith('+')
      ) {
        return `${leading}\\${rest}`;
      }
      if (/^\d+[.)]\s/.test(rest)) {
        return `${leading}\\${rest}`;
      }
      if (rest.startsWith('```')) {
        return `${leading}\\${rest}`;
      }
      return line;
    })
    .join('\n');
}

function indentLines(text: string, indent: number): string {
  if (indent <= 0) {
    return text;
  }
  const prefix = '  '.repeat(indent);
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? `${prefix}${line}` : line))
    .join('\n');
}

function prefixBlockquote(text: string): string {
  const trimmed = text.replace(/\n+$/, '');
  return trimmed
    .split('\n')
    .map((line) => {
      if (line.length === 0) {
        return '>';
      }
      if (/^(\s*)([-*+])\s+/.test(line) || /^(\s*)\d+[.)]\s+/.test(line)) {
        return `> ${line}`;
      }
      return `> ${line}`;
    })
    .join('\n');
}

function isListType(type: string): boolean {
  return type === 'bulleted_list_item' || type === 'numbered_list_item' || type === 'to_do';
}

function wrapInlineCode(text: string): string {
  const matches = text.match(/`+/g) || [];
  const longest = matches.reduce((max, match) => Math.max(max, match.length), 0);
  const fence = '`'.repeat(longest + 1);
  return `${fence}${text}${fence}`;
}

function wrapCodeBlock(text: string, language: string): string {
  const matches = text.match(/`+/g) || [];
  const longest = matches.reduce((max, match) => Math.max(max, match.length), 0);
  const fence = '`'.repeat(Math.max(3, longest + 1));
  const lang = language || 'text';
  return `${fence}${lang}\n${text}\n${fence}\n\n`;
}

function richTextToPlainText(richText: RichTextItem[]): string {
  if (!richText || !Array.isArray(richText)) {
    return '';
  }

  return richText.map((rt) => rt.plain_text ?? rt.text?.content ?? '').join('');
}

/**
 * Convert a RichTextItem array to markdown text
 */
export function richTextToMarkdown(richText: RichTextItem[]): string {
  if (!richText || !Array.isArray(richText)) {
    return '';
  }

  return richText
    .map((rt) => {
      const baseText = rt.plain_text ?? rt.text?.content ?? '';
      let text = escapeLineStartMarkdown(escapeInlineMarkdown(baseText));
      const annotations = rt.annotations;

      if (annotations?.code) {
        text = wrapInlineCode(baseText);
        if (rt.text?.link?.url) {
          text = `[${text}](${rt.text.link.url})`;
        }
        return text;
      }

      if (annotations?.bold) {
        text = `**${text}**`;
      }
      if (annotations?.italic) {
        text = `*${text}*`;
      }
      if (annotations?.strikethrough) {
        text = `~~${text}~~`;
      }
      if (annotations?.underline) {
        text = `<u>${text}</u>`;
      }

      if (rt.text?.link?.url) {
        text = `[${text}](${rt.text.link.url})`;
      }

      return text;
    })
    .join('');
}

/**
 * Convert a Notion block to markdown string
 * @param block - Block object to convert
 * @returns Markdown string representation of the block
 */
export function blockToMarkdown(block: Block): string {
  const type = block.type;
  const content = block[type as keyof Block];

  if (!content || typeof content !== 'object') {
    return '';
  }

  const blockContent = content as Record<string, unknown>;

  switch (type) {
    case 'paragraph': {
      const paraText = richTextToMarkdown((blockContent.rich_text ?? []) as RichTextItem[]);
      return paraText ? paraText + '\n\n' : '';
    }

    case 'heading_1':
      return `# ${richTextToMarkdown((blockContent.rich_text ?? []) as RichTextItem[])}\n\n`;

    case 'heading_2':
      return `## ${richTextToMarkdown((blockContent.rich_text ?? []) as RichTextItem[])}\n\n`;

    case 'heading_3':
      return `### ${richTextToMarkdown((blockContent.rich_text ?? []) as RichTextItem[])}\n\n`;

    case 'bulleted_list_item':
      return `- ${richTextToMarkdown((blockContent.rich_text ?? []) as RichTextItem[])}\n`;

    case 'numbered_list_item':
      return `1. ${richTextToMarkdown((blockContent.rich_text ?? []) as RichTextItem[])}\n`;

    case 'to_do': {
      const todoContent = blockContent as { checked?: boolean; rich_text?: RichTextItem[] };
      const checkbox = todoContent.checked ? '[x]' : '[ ]';
      return `- ${checkbox} ${richTextToMarkdown(todoContent.rich_text ?? [])}\n`;
    }

    case 'quote':
      return `> ${richTextToMarkdown((blockContent.rich_text ?? []) as RichTextItem[])}\n\n`;

    case 'callout':
      return `> 💡 ${richTextToMarkdown((blockContent.rich_text ?? []) as RichTextItem[])}\n\n`;

    case 'code': {
      const codeContent = blockContent as { language?: string; rich_text?: RichTextItem[] };
      const lang = codeContent.language ?? 'text';
      const codeText = richTextToPlainText(codeContent.rich_text ?? []);
      return wrapCodeBlock(codeText, lang);
    }

    case 'divider':
      return '\n---\n\n';

    case 'toggle': {
      const toggleContent = blockContent as { rich_text?: RichTextItem[] };
      const toggleText = richTextToMarkdown(toggleContent.rich_text ?? []);
      return `<details><summary>${toggleText}</summary></details>\n\n`;
    }

    case 'image': {
      const imageContent = blockContent as {
        external?: { url: string };
        file?: { url: string };
        caption?: RichTextItem[];
      };
      const imageUrl = imageContent.external?.url ?? imageContent.file?.url ?? '';
      const imageCaption = imageContent.caption ? richTextToMarkdown(imageContent.caption) : '';
      return `![${imageCaption}](${imageUrl})\n\n`;
    }

    case 'embed': {
      const embedContent = blockContent as { url: string };
      return `[Embed](${embedContent.url})\n\n`;
    }

    case 'bookmark': {
      const bookmarkContent = blockContent as { url: string; caption?: RichTextItem[] };
      const bookmarkCaption = bookmarkContent.caption
        ? richTextToMarkdown(bookmarkContent.caption)
        : '';
      return `[🔖 ${bookmarkCaption || bookmarkContent.url}](${bookmarkContent.url})\n\n`;
    }

    case 'video': {
      const videoContent = blockContent as {
        external?: { url: string };
        file?: { url: string };
      };
      const videoUrl = videoContent.external?.url ?? videoContent.file?.url ?? '';
      return `[Video](${videoUrl})\n\n`;
    }

    case 'pdf': {
      const pdfContent = blockContent as {
        external?: { url: string };
        file?: { url: string };
      };
      const pdfUrl = pdfContent.external?.url ?? pdfContent.file?.url ?? '';
      return `[PDF](${pdfUrl})\n\n`;
    }

    case 'file': {
      const fileContent = blockContent as {
        caption?: RichTextItem[];
        external?: { url: string };
        file?: { url: string };
      };
      const fileName = fileContent.caption ? richTextToMarkdown(fileContent.caption) : 'File';
      const fileUrl = fileContent.external?.url ?? fileContent.file?.url ?? '';
      return `[📎 ${fileName}](${fileUrl})\n\n`;
    }

    case 'audio': {
      const audioContent = blockContent as { external?: { url: string }; file?: { url: string } };
      const audioUrl = audioContent.external?.url ?? audioContent.file?.url ?? '';
      return `[Audio](${audioUrl})\n\n`;
    }

    case 'table': {
      const tableContent = blockContent as { table_width?: number };
      const tableWidth = tableContent.table_width ?? 2;
      const header = `| ${Array(tableWidth).fill(' ').join(' | ')} |`;
      const separator = `| ${Array(tableWidth).fill('---').join(' | ')} |`;
      return `${header}\n${separator}\n`;
    }

    case 'table_row': {
      const tableRowContent = blockContent as { cells?: RichTextItem[][] };
      const cells = tableRowContent.cells ?? [];
      const cellTexts = cells.map((cell: RichTextItem[]) => (cell ? richTextToMarkdown(cell) : ''));
      return `| ${cellTexts.join(' | ')} |\n`;
    }

    case 'column_list':
      return ''; // Container, no direct output

    case 'column':
      return ''; // Container, no direct output

    case 'synced_block':
      return `<!-- Synced block -->\n\n`;

    case 'breadcrumb':
      return `<!-- Breadcrumb -->\n\n`;

    case 'table_of_contents':
      return `<!-- Table of Contents -->\n\n`;

    case 'link_to_page': {
      const linkPageContent = blockContent as { page_id?: string };
      const pageId = linkPageContent.page_id ?? '';
      return `[Link to page](https://notion.so/${pageId})\n\n`;
    }

    case 'link_preview': {
      const linkPreviewContent = blockContent as { url: string };
      return `[Preview](${linkPreviewContent.url})\n\n`;
    }

    case 'template': {
      const templateContent = blockContent as { rich_text?: RichTextItem[] };
      return `<!-- Template: ${richTextToMarkdown(templateContent.rich_text ?? [])} -->\n\n`;
    }

    case 'child_page': {
      const childPageContent = blockContent as { title?: string };
      const childTitle = childPageContent.title ?? 'Untitled';
      return `📄 **${childTitle}**\n\n`;
    }

    case 'child_database': {
      const childDbContent = blockContent as { title?: string };
      const dbTitle = childDbContent.title ?? 'Untitled Database';
      return `🗄️ **${dbTitle}**\n\n`;
    }

    case 'equation': {
      const equationContent = blockContent as {
        expression?: string;
        equation?: { expression: string };
      };
      const equation = equationContent.expression ?? equationContent.equation?.expression ?? '';
      return `$${equation}$\n\n`;
    }

    default: {
      // Unknown block type - try to extract any text
      const defaultContent = blockContent as { rich_text?: RichTextItem[] };
      const text = richTextToMarkdown(defaultContent.rich_text ?? []);
      return text ? text + '\n\n' : '';
    }
  }
}

export function blocksToMarkdown(
  blocks: Block[],
  childrenById: Record<string, Block[]>,
  depth: number = 0
): string {
  let output = '';

  for (const block of blocks) {
    if (block.type === 'table') {
      const tableContent = block.table as { table_width?: number } | undefined;
      const tableWidth = tableContent?.table_width ?? 2;
      const header = `| ${Array(tableWidth).fill(' ').join(' | ')} |`;
      const separator = `| ${Array(tableWidth).fill('---').join(' | ')} |`;
      output += `${header}\n${separator}\n`;

      const childBlocks = childrenById[block.id] ?? [];
      output += blocksToMarkdown(childBlocks, childrenById, depth);
      output += '\n';
      continue;
    }

    if (block.type === 'toggle') {
      const toggleContent = block.toggle as { rich_text?: RichTextItem[] } | undefined;
      const summary = toggleContent ? richTextToMarkdown(toggleContent.rich_text ?? []) : '';
      const childMarkdown = blocksToMarkdown(childrenById[block.id] ?? [], childrenById, depth + 1);
      output += `<details><summary>${summary}</summary>\n\n${childMarkdown}</details>\n\n`;
      continue;
    }

    const blockMarkdown = blockToMarkdown(block);
    if (blockMarkdown) {
      const indentLevel = isListType(block.type) ? depth : Math.max(0, depth);
      output += indentLines(blockMarkdown, indentLevel);
    }

    if (block.has_children) {
      const childBlocks = childrenById[block.id] || [];
      const childDepth = isListType(block.type) ? depth + 1 : depth;
      const childMarkdown = blocksToMarkdown(childBlocks, childrenById, childDepth);
      if (block.type === 'quote' || block.type === 'callout') {
        output += `${prefixBlockquote(childMarkdown)}\n\n`;
      } else {
        output += childMarkdown;
      }
    }
  }

  return output;
}

/**
 * Convert a page's blocks to markdown document
 */
export function pageToMarkdown(page: Page, blocks: Block[]): string {
  const title =
    page.properties?.title?.title?.map((t) => t.plain_text).join('') ||
    page.properties?.Name?.title?.map((t) => t.plain_text).join('') ||
    'Untitled';

  let markdown = `# ${title}\n\n`;

  // Add page metadata
  markdown += `**URL:** ${page.url}\n`;
  markdown += `**Created:** ${page.created_time}\n`;
  markdown += `**Last Edited:** ${page.last_edited_time}\n\n`;
  markdown += `---\n\n`;

  // Add blocks
  for (const block of blocks) {
    markdown += blockToMarkdown(block);
  }

  return markdown;
}

export function pageToMarkdownTree(
  page: Page,
  blocks: Block[],
  childrenById: Record<string, Block[]>
): string {
  const title =
    page.properties?.title?.title?.map((t) => t.plain_text).join('') ||
    page.properties?.Name?.title?.map((t) => t.plain_text).join('') ||
    'Untitled';

  let markdown = `# ${title}\n\n`;

  // Add page metadata
  markdown += `**URL:** ${page.url}\n`;
  markdown += `**Created:** ${page.created_time}\n`;
  markdown += `**Last Edited:** ${page.last_edited_time}\n\n`;
  markdown += `---\n\n`;

  markdown += blocksToMarkdown(blocks, childrenById);

  return markdown;
}

/**
 * Sanitize a string for use as filename
 * @param name - The filename to sanitize
 * @param maxLength - Maximum length of the filename (default: 100)
 * @returns Sanitized filename safe for filesystem use
 */
export function sanitizeFilename(name: string, maxLength: number = 100): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, maxLength)
    .replace(/^-+|-+$/g, '');
}

/**
 * Write content to a file, creating directories if needed
 * @param filePath - Full path to the output file
 * @param content - Content to write to the file
 */
export function writeToFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Format options for markdown conversion
 */
export interface MarkdownFormatOptions {
  includeMetadata?: boolean;
  includeUrl?: boolean;
}
