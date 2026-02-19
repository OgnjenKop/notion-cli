/**
 * Tests for output utilities
 */

import {
  formatOutput,
  printOutput,
  printSuccess,
  printError,
  printInfo,
  printPageSummary,
  printDatabaseSummary,
  printUserSummary,
  printBlockSummary,
  getPageTitle,
  getBlockContent,
} from '../lib/output';
import { Page, Database, User, Block } from '../lib/types';

describe('formatOutput', () => {
  it('should format as JSON when json option is true', () => {
    const data = { key: 'value' };
    const result = formatOutput(data, { json: true });

    expect(result).toBe('{\n  "key": "value"\n}');
  });

  it('should return string as-is when json is false', () => {
    const result = formatOutput('plain text', {});
    expect(result).toBe('plain text');
  });

  it('should format object as JSON by default', () => {
    const data = { name: 'test' };
    const result = formatOutput(data);

    expect(result).toContain('"name": "test"');
  });
});

describe('printOutput', () => {
  it('should print formatted output', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    printOutput({ key: 'value' });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"key": "value"'));
    consoleSpy.mockRestore();
  });

  it('should not print when quiet mode is enabled', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    printOutput({ key: 'value' }, { quiet: true });

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('printSuccess', () => {
  it('should print success message with checkmark', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    printSuccess('Operation completed');

    expect(consoleSpy).toHaveBeenCalledWith('✓ Operation completed');
    consoleSpy.mockRestore();
  });

  it('should not print when quiet mode is enabled', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    printSuccess('Operation completed', true);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('printError', () => {
  it('should print error message with cross', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    printError('Something went wrong');

    expect(consoleSpy).toHaveBeenCalledWith('✗ Something went wrong');
    consoleSpy.mockRestore();
  });

  it('should print additional error details', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    printError('Error occurred', 'Detailed error message');

    expect(consoleSpy).toHaveBeenCalledWith('✗ Error occurred');
    expect(consoleSpy).toHaveBeenCalledWith('  Detailed error message');
    consoleSpy.mockRestore();
  });
});

describe('printInfo', () => {
  it('should print info message with info symbol', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    printInfo('Processing...');

    expect(consoleSpy).toHaveBeenCalledWith('ℹ Processing...');
    consoleSpy.mockRestore();
  });

  it('should not print when quiet mode is enabled', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    printInfo('Processing...', true);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('printPageSummary', () => {
  it('should print page summary', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const page: Partial<Page> = {
      id: 'page-123',
      url: 'https://notion.so/page-123',
      properties: {
        Name: {
          id: 'title',
          type: 'title',
          title: [{ plain_text: 'Test Page' }],
        },
      },
    };

    printPageSummary(page as Page);

    expect(consoleSpy).toHaveBeenCalledWith('[PAGE] Test Page');
    expect(consoleSpy).toHaveBeenCalledWith('  ID: page-123');
    expect(consoleSpy).toHaveBeenCalledWith('  URL: https://notion.so/page-123');
    consoleSpy.mockRestore();
  });

  it('should print status if available', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const page: Partial<Page> = {
      id: 'page-123',
      properties: {
        Status: {
          id: 'status',
          type: 'select',
          select: { id: '1', name: 'Done' },
        },
        Name: {
          id: 'title',
          type: 'title',
          title: [{ plain_text: 'Test Page' }],
        },
      },
    };

    printPageSummary(page as Page);

    expect(consoleSpy).toHaveBeenCalledWith('  Status: Done');
    consoleSpy.mockRestore();
  });
});

describe('getPageTitle', () => {
  it('should extract title from Name property', () => {
    const page: Partial<Page> = {
      properties: {
        Name: {
          id: 'title',
          type: 'title',
          title: [{ plain_text: 'My Page' }],
        },
      },
    };

    const title = getPageTitle(page as Page);
    expect(title).toBe('My Page');
  });

  it('should extract title from title property', () => {
    const page: Partial<Page> = {
      properties: {
        title: {
          id: 'title',
          type: 'title',
          title: [{ plain_text: 'My Page' }],
        },
      },
    };

    const title = getPageTitle(page as Page);
    expect(title).toBe('My Page');
  });

  it('should return Untitled for page without title', () => {
    const page: Partial<Page> = {
      properties: {},
    };

    const title = getPageTitle(page as Page);
    expect(title).toBe('Untitled');
  });
});

describe('printDatabaseSummary', () => {
  it('should print database summary', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const db: Partial<Database> = {
      id: 'db-123',
      url: 'https://notion.so/db-123',
      title: [{ plain_text: 'Tasks Database' }],
      properties: {
        Name: { id: 'title', name: 'Name', type: 'title', title: {} },
        Status: {
          id: 'status',
          name: 'Status',
          type: 'select',
          select: { options: [{ id: '1', name: 'Done' }] },
        },
      },
    };

    printDatabaseSummary(db as Database);

    expect(consoleSpy).toHaveBeenCalledWith('[DATABASE] Tasks Database');
    expect(consoleSpy).toHaveBeenCalledWith('  ID: db-123');
    expect(consoleSpy).toHaveBeenCalledWith('  URL: https://notion.so/db-123');
    expect(consoleSpy).toHaveBeenCalledWith('  Properties: Name, Status');
    consoleSpy.mockRestore();
  });

  it('should show Untitled Database for database without title', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const db: Partial<Database> = {
      id: 'db-123',
      title: [],
    };

    printDatabaseSummary(db as Database);

    expect(consoleSpy).toHaveBeenCalledWith('[DATABASE] Untitled Database');
    consoleSpy.mockRestore();
  });
});

describe('printUserSummary', () => {
  it('should print user summary', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const user: Partial<User> = {
      id: 'user-123',
      name: 'John Doe',
      type: 'person',
      person: { email: 'john@example.com' },
    };

    printUserSummary(user as User);

    expect(consoleSpy).toHaveBeenCalledWith('[USER] John Doe');
    expect(consoleSpy).toHaveBeenCalledWith('  ID: user-123');
    expect(consoleSpy).toHaveBeenCalledWith('  Type: person');
    expect(consoleSpy).toHaveBeenCalledWith('  Email: john@example.com');
    consoleSpy.mockRestore();
  });

  it('should show Unknown for user without name', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const user: Partial<User> = {
      id: 'user-123',
      type: 'bot',
    };

    printUserSummary(user as User);

    expect(consoleSpy).toHaveBeenCalledWith('[USER] Unknown');
    consoleSpy.mockRestore();
  });
});

describe('printBlockSummary', () => {
  it('should print block summary', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const block: Partial<Block> = {
      id: 'block-123',
      type: 'paragraph',
      has_children: false,
      paragraph: { rich_text: [] },
    };

    printBlockSummary(block as Block);

    expect(consoleSpy).toHaveBeenCalledWith('[PARAGRAPH] ');
    expect(consoleSpy).toHaveBeenCalledWith('  ID: block-123');
    consoleSpy.mockRestore();
  });

  it('should indicate block has children', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const block: Partial<Block> = {
      id: 'block-123',
      type: 'paragraph',
      has_children: true,
      paragraph: { rich_text: [] },
    };

    printBlockSummary(block as Block);

    expect(consoleSpy).toHaveBeenCalledWith('  ID: block-123 (has children)');
    consoleSpy.mockRestore();
  });
});

describe('getBlockContent', () => {
  it('should extract text from rich_text block', () => {
    const block: Partial<Block> = {
      type: 'paragraph',
      paragraph: {
        rich_text: [{ plain_text: 'Hello ' }, { plain_text: 'World' }],
      },
    };

    const content = getBlockContent(block as Block);
    expect(content).toBe('Hello World');
  });

  it('should return divider for divider block', () => {
    const block: Partial<Block> = {
      type: 'divider',
      divider: {},
    };

    const content = getBlockContent(block as Block);
    expect(content).toBe('---');
  });

  it('should return URL for image block', () => {
    const block: Partial<Block> = {
      type: 'image',
      image: {
        type: 'external',
        external: { url: 'https://example.com/image.png' },
      },
    };

    const content = getBlockContent(block as Block);
    expect(content).toBe('https://example.com/image.png');
  });

  it('should return empty string for unknown block type', () => {
    const block: Partial<Block> = {
      type: 'unknown_type',
    };

    const content = getBlockContent(block as Block);
    expect(content).toBe('');
  });
});
