import * as fs from 'fs';
import * as path from 'path';
import { Block, Page, RichTextItem } from './types';

/**
 * Convert a RichTextItem array to markdown text
 */
export function richTextToMarkdown(richText: RichTextItem[]): string {
  if (!richText || !Array.isArray(richText)) {
    return '';
  }

  return richText
    .map((rt) => {
      let text = rt.text?.content || '';
      const annotations = (rt.annotations as any) || {};

      if (annotations.bold) {
        text = `**${text}**`;
      }
      if (annotations.italic) {
        text = `*${text}*`;
      }
      if (annotations.strikethrough) {
        text = `~~${text}~~`;
      }
      if (annotations.underline) {
        text = `_${text}_`; // Use italic-style for underline (markdown doesn't support underline)
      }
      if (annotations.code) {
        text = `\`${text}\``;
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
 */
export function blockToMarkdown(block: Block): string {
  const type = block.type;
  const content = (block as any)[type];

  if (!content) {
    return '';
  }

  switch (type) {
    case 'paragraph': {
      const paraText = richTextToMarkdown(content.rich_text);
      return paraText ? paraText + '\n\n' : '';
    }

    case 'heading_1':
      return `# ${richTextToMarkdown(content.rich_text)}\n\n`;

    case 'heading_2':
      return `## ${richTextToMarkdown(content.rich_text)}\n\n`;

    case 'heading_3':
      return `### ${richTextToMarkdown(content.rich_text)}\n\n`;

    case 'bulleted_list_item':
      return `- ${richTextToMarkdown(content.rich_text)}\n`;

    case 'numbered_list_item':
      return `1. ${richTextToMarkdown(content.rich_text)}\n`;

    case 'to_do': {
      const checkbox = content.checked ? '[x]' : '[ ]';
      return `- ${checkbox} ${richTextToMarkdown(content.rich_text)}\n`;
    }

    case 'quote':
      return `> ${richTextToMarkdown(content.rich_text)}\n\n`;

    case 'callout':
      return `> 💡 ${richTextToMarkdown(content.rich_text)}\n\n`;

    case 'code': {
      const lang = content.language || 'text';
      const codeText = richTextToMarkdown(content.rich_text);
      return `\`\`\`${lang}\n${codeText}\n\`\`\`\n\n`;
    }

    case 'divider':
      return '\n---\n\n';

    case 'toggle': {
      const toggleText = richTextToMarkdown(content.rich_text);
      // Use collapsible details element for toggle blocks (GitHub/markdown compatible)
      return `<details><summary>${toggleText}</summary></details>\n\n`;
    }

    case 'image': {
      const imageUrl = content.external?.url || content.file?.url || '';
      const imageCaption = content.caption ? richTextToMarkdown(content.caption) : '';
      return `![${imageCaption}](${imageUrl})\n\n`;
    }

    case 'embed':
      return `[Embed](${content.url})\n\n`;

    case 'bookmark': {
      const bookmarkCaption = content.caption ? richTextToMarkdown(content.caption) : '';
      return `[🔖 ${bookmarkCaption || content.url}](${content.url})\n\n`;
    }

    case 'video': {
      const videoUrl = content.external?.url || content.file?.url || '';
      return `[Video](${videoUrl})\n\n`;
    }

    case 'pdf': {
      const pdfUrl = content.external?.url || content.file?.url || '';
      return `[PDF](${pdfUrl})\n\n`;
    }

    case 'file': {
      const fileName = content.caption ? richTextToMarkdown(content.caption) : 'File';
      const fileUrl = content.external?.url || content.file?.url || '';
      return `[📎 ${fileName}](${fileUrl})\n\n`;
    }

    case 'audio': {
      const audioUrl = content.external?.url || content.file?.url || '';
      return `[Audio](${audioUrl})\n\n`;
    }

    case 'table': {
      // Table header - actual rows come as children
      const tableWidth = content.table_width || 2;
      return `| ${Array(tableWidth).fill('---').join(' | ')} |\n`;
    }

    case 'table_row': {
      const cells = content.cells || [];
      const cellTexts = cells.map((cell: any[]) => (cell ? richTextToMarkdown(cell) : ''));
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
      const pageId = content.page_id;
      return `[Link to page](https://notion.so/${pageId})\n\n`;
    }

    case 'link_preview':
      return `[Preview](${content.url})\n\n`;

    case 'template':
      return `<!-- Template: ${richTextToMarkdown(content.rich_text)} -->\n\n`;

    case 'child_page': {
      const childTitle = content.title || 'Untitled';
      return `📄 **${childTitle}**\n\n`;
    }

    case 'child_database': {
      const dbTitle = content.title || 'Untitled Database';
      return `🗄️ **${dbTitle}**\n\n`;
    }

    case 'equation': {
      const equation = content.expression?.equation || '';
      return `$${equation}$\n\n`;
    }

    default: {
      // Unknown block type - try to extract any text
      const text = richTextToMarkdown(content.rich_text);
      return text ? text + '\n\n' : '';
    }
  }
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

/**
 * Sanitize a string for use as filename
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
